import { GaxiosResponse } from "gaxios";
import { Credentials, OAuth2Client } from "google-auth-library";
import { calendar_v3, google, oauth2_v2 } from "googleapis";

import { EventAttendeeRole } from "../../core/enums/EventAttendeeRole";
import { EventAttendeeStatus } from "../../core/enums/EventAttendeeStatus";
import { EventType } from "../../core/enums/EventType";
import { EventVisibility } from "../../core/enums/EventVisibility";

import { Calendar } from "../../models/entities/Calendar";
import { CalendarMember } from "../../models/entities/CalendarMember";
import { Event } from "../../models/entities/Event";
import { User } from "../../models/entities/User";

import { CalendarMemberRole } from "../../core/enums/CalendarMemberRole";

import { CalendarRepository } from "../../models/CalendarRepository";
import { EventRepository } from "../../models/EventRepository";
import { UserRepository } from "../../models/UserRepository";

type ServiceCredentials = {
    readonly clientId: string;
    readonly clientSecret: string;
    readonly redirectUri: string;
    readonly scopes: string;
};

export class GoogleApiService {
    private readonly oauth: OAuth2Client;

    constructor(
        private readonly eventRepository: EventRepository,
        private readonly userRepository: UserRepository,
        private readonly calendarRepository: CalendarRepository,
        private readonly credentials: ServiceCredentials,
    ) {
        this.eventRepository = eventRepository;
        this.userRepository = userRepository;
        this.calendarRepository = calendarRepository;
        this.oauth = new google.auth.OAuth2(
            credentials.clientId,
            credentials.clientSecret,
            credentials.redirectUri,
        );
    }

    public generateAuthUrl(): string {
        return this.oauth.generateAuthUrl({
            access_type: "offline", // "offline" to obtain a refresh_token
            scope: this.credentials.scopes,
        });
    }

    public async getCredentialsFromCode(code: string): Promise<Credentials> {
        const response = await this.oauth.getToken(code);
        return response.tokens;
    }

    public async getUserInfo(accessToken: string, refreshToken?: string): Promise<oauth2_v2.Schema$Userinfoplus> {
        const client = this.createOauthApiClient(accessToken, refreshToken);

        const res = await client.userinfo.get();
        return res.data;
    }

    public async updateCalendarEvents(
        calendarId: number,
        user: User,
    ): Promise<void> {
        const calendar = await this.calendarRepository.getCalendar(calendarId);
        if (!calendar) {
            throw new Error("Calendar not found");
        }

        if (!calendar.googleCalendarSyncToken) {
            return;
        }

        this.oauth.setCredentials({
            refresh_token: user.googleProviderPayload!.refreshToken,
            access_token: user.googleProviderPayload!.accessToken,
            token_type: user.googleProviderPayload!.tokenType,
        });

        const calendarApi = google.calendar("v3");

        let nextPageToken;
        const lastSyncToken = calendar.googleCalendarSyncToken;

        const googleCalId: string = Object.keys(user.googleProviderPayload!.syncedGoogleCalendars)
            .find(key => user.googleProviderPayload!.syncedGoogleCalendars[key] === calendarId)!;

        do {
            const events: any = await calendarApi.events.list({
                auth: this.oauth,
                calendarId: googleCalId,
                syncToken: lastSyncToken ? lastSyncToken : undefined,
                pageToken: nextPageToken,
            });

            events.data.items
                .filter(this.isValidEvent)
                .map((e: any) => this.loadGoogleEvent(this.eventRepository, e, calendar, user));

            nextPageToken = events.data.nextPageToken;
            if (nextPageToken === undefined) {
                calendar.googleCalendarSyncToken = events.data.nextSyncToken;
            }
        } while (nextPageToken !== undefined);

        return ;
    }

    public async fetchGoogleCalendars(calendarMembers: CalendarMember[], user: User): Promise<Calendar[]> {
        if (!user.googleProviderPayload) {
            throw new Error("Missing providerPayload");
        }

        this.oauth.setCredentials({
            refresh_token: user.googleProviderPayload.refreshToken,
            access_token: user.googleProviderPayload.accessToken,
            token_type: user.googleProviderPayload.tokenType,
        });

        const calendarApi = google.calendar("v3");

        const calendarsPromises: Array<Promise<Calendar>> = [];
        let nextPageToken;
        const lastSyncToken = user.googleProviderPayload.googleCalendarListSyncToken;

        do {
            const gcal: GaxiosResponse<calendar_v3.Schema$CalendarList> = await calendarApi.calendarList.list({
                auth: this.oauth,
                syncToken: lastSyncToken,
                pageToken: nextPageToken,
            });

            calendarsPromises.push(...gcal.data.items!
                .filter(this.isValidCalendar)
                .map((cal: calendar_v3.Schema$CalendarListEntry) => this.importCalendar(
                    this.eventRepository,
                    calendarMembers,
                    cal,
                    calendarApi,
                    user,
                ),
            ));

            nextPageToken = gcal.data.nextPageToken ? gcal.data.nextPageToken : undefined;
            if (nextPageToken === undefined) {
                user.googleProviderPayload.googleCalendarListSyncToken = gcal.data.nextSyncToken
                    ? gcal.data.nextSyncToken
                    : undefined;
            }
        } while (nextPageToken !== undefined);

        return Promise.all(calendarsPromises);
    }

    private createOauthApiClient(accessToken: string, refreshToken?: string): oauth2_v2.Oauth2 {
        this.oauth.setCredentials({
            refresh_token: refreshToken,
            access_token: accessToken,
        });
        return google.oauth2({
            auth: this.oauth,
            version: "v2",
        });
    }

    private isValidEvent(googleEvent: calendar_v3.Schema$Event): boolean {
        return googleEvent !== undefined
            && googleEvent.start !== undefined
            && googleEvent.start.dateTime !== undefined
            && googleEvent.summary !== undefined;
    }

    private fetchOrCreateCalendar(
        calendarMembers: CalendarMember[],
        user: User,
        pwId: number,
        googleCalendar: calendar_v3.Schema$CalendarListEntry,
    ): Calendar {

        if (pwId === undefined) {
            const calendar = new Calendar({ name: googleCalendar.summary!, color: undefined });
            calendar.entries = [];

            this.calendarRepository.createCalendar(
                calendar,
                [{
                    user: user,
                    role: CalendarMemberRole.Admin,
                    invitationConfirmed: true,
                }]);
            return calendar;
        }
        const calendarMember = calendarMembers.find(c => c.calendarId === pwId)!;
        return calendarMember.calendar!;
    }

    private isValidCalendar(cal: calendar_v3.Schema$CalendarListEntry): boolean {
        return cal.summary !== "Week Numbers";
    }

    private async importCalendar(
        eventRepository: EventRepository,
        calendarMembers: CalendarMember[],
        googleCalendar: calendar_v3.Schema$CalendarListEntry,
        calendar: calendar_v3.Calendar,
        user: User,
    ): Promise<Calendar> {

        const pwId = user.googleProviderPayload!.syncedGoogleCalendars[googleCalendar.id!];
        const importedCalendar = await this.fetchOrCreateCalendar(
            calendarMembers, user, pwId, googleCalendar,
        );

        let nextPageToken;
        const lastSyncToken = importedCalendar.googleCalendarSyncToken;

        do {
            const events: any = await calendar.events.list({
                auth: this.oauth,
                calendarId: googleCalendar.id!,
                syncToken: lastSyncToken ? lastSyncToken : undefined,
                pageToken: nextPageToken,
            });

            events.data.items
                .filter(this.isValidEvent)
                .map((e: any) => this.loadGoogleEvent(eventRepository, e, importedCalendar, user));

            nextPageToken = events.data.nextPageToken;
            if (nextPageToken === undefined) {
                importedCalendar.googleCalendarSyncToken = events.data.nextSyncToken;
            }
        } while (nextPageToken !== undefined);
        user.googleProviderPayload!.syncedGoogleCalendars[googleCalendar.id!] = importedCalendar.id;
        await this.userRepository.updateUser(user);
        return this.calendarRepository.updateCalendar(importedCalendar);
    }

    private async loadGoogleEvent(
        eventRepository: EventRepository,
        googleEvent: calendar_v3.Schema$Event,
        importedCalendar: Calendar,
        user: User,
    ): Promise<void> {
        await eventRepository.createEvent(
            new Event({
                name: googleEvent.summary!,
                description: googleEvent.description!,
                startTime: new Date(googleEvent.start!.dateTime!),
                endTime: googleEvent.endTimeUnspecified
                    ? new Date(googleEvent.start!.dateTime!)
                    : new Date(googleEvent.end!.dateTime!),
                type: EventType.Work,
                location: googleEvent.location!,
                visibility: googleEvent.visibility === "public" ? EventVisibility.Public : EventVisibility.Private,
                color: googleEvent.colorId!,
            }),
            [{
                user: user,
                role: EventAttendeeRole.Admin,
                status: EventAttendeeStatus.Going,
            }],
            importedCalendar,
        );
    }
}
