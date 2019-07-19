import { Request, Response } from "express";
import Boom from "@hapi/boom";

import CalendarMemberRole from "../core/enums/CalendarMemberRole";
import EventAttendeeRole from "../core/enums/EventAttendeeRole";
import EventAttendeeStatus from "../core/enums/EventAttendeeStatus";

import Calendar from "../models/entities/Calendar";

import CalendarRepository from "../models/CalendarRepository";
import EventRepository from "../models/EventRepository";

import CalendarPolicy from "../policies/CalendarPolicy";
import EventPolicy from "../policies/EventPolicy";

import CalendarView from "../views/CalendarView";

import { trim } from "../utils/string/trim";
import { getRequestingUser } from "../middleware/utils/getRequestingUser";

import CalendarInvitationStatus, { calendarInvitationStatusFromString } from "./enums/CalendarInvitationStatus";


class CalendarController {

    private readonly calendarRepository: CalendarRepository;
    private readonly eventRepository: EventRepository;

    private readonly calendarPolicy: CalendarPolicy;
    private readonly eventPolicy: EventPolicy;

    private readonly calendarView: CalendarView;

    constructor(
        // Repositories
        calendarRepository: CalendarRepository,
        eventRepository: EventRepository,

        // Policies
        calendarPolicy: CalendarPolicy,
        eventPolicy: EventPolicy,

        // Views
        calendarView: CalendarView
    ) {
        this.calendarRepository = calendarRepository;
        this.eventRepository = eventRepository;
        this.calendarPolicy = calendarPolicy;
        this.eventPolicy = eventPolicy;
        this.calendarView = calendarView;
    }

    public readonly createCalendar = async (req: Request, res: Response) => {
        const requestingUser = getRequestingUser(req);

        const calendarName = trim(req.body.name);
        const calendarColor = trim(req.body.color);

        // Validate request's parameters
        if (!calendarName || !calendarColor) {
            throw Boom.badRequest("Missing fields for Calendar");
        }

        // Create and save new Calendar
        const calendar = await this.calendarRepository.createCalendar(
            new Calendar({
                name: calendarName,
                color: calendarColor
            }),
            [{
                user: requestingUser,
                role: CalendarMemberRole.Admin,
                invitationConfirmed: true
            }]
        );

        // Make sure the requesting User has been added to the Calendar
        const calendarMembership = await this.calendarRepository.getCalendarMemberShip(calendar.id, requestingUser.id);
        if (!calendarMembership) {
            throw new Error("The requesting User should be a member of the calendar");
        }

        res.status(201).json({
            message: "Calendar created",
            calendar: this.calendarView.formatCalendarWithMembershipAndMembers(calendar, calendarMembership)
        });
    };

    public readonly getCalendarInfo = async (req: Request, res: Response) => {
        const requestingUser = getRequestingUser(req);

        // Validate request's parameters
        const calendarId: number = parseInt(req.params.calendarId, 10);
        if (isNaN(calendarId)) {
            throw Boom.notFound(`Calendar id "${req.params.calendarId}" is invalid`);
        }

        // Make sure User can access Calendar
        const calendarMembership = await this.calendarRepository.getCalendarMemberShip(calendarId, requestingUser.id);
        if (!calendarMembership
            || !this.calendarPolicy.userCanReadCalendar(calendarMembership)) {
            throw Boom.unauthorized("You cannot access this Calendar");
        }

        // Retrieve Calendar
        const calendar = await this.calendarRepository.getCalendarWithMembers(calendarId);
        if (!calendar) {
            throw Boom.notFound("Calendar does not exists");
        }

        res.status(200).json({
            message: "OK",
            calendar: this.calendarView.formatCalendarWithMembershipAndMembers(calendar, calendarMembership)
        });
    };

    public readonly editCalendarInfo = async (req: Request, res: Response) => {
        const requestingUser = getRequestingUser(req);

        // Validate request's parameters
        const calendarId: number = parseInt(req.params.calendarId, 10);
        const calendarNewName = trim(req.body.name);
        const calendarNewColor = trim(req.body.color);
        if (isNaN(calendarId)) {
            throw Boom.notFound(`Calendar id "${req.params.calendarId}" is invalid`);
        }
        if (!calendarNewName || !calendarNewColor) {
            throw Boom.badRequest("Missing fields for Calendar");
        }

        // Make sure User can edit Calendar
        const calendarMembership = await this.calendarRepository.getCalendarMemberShip(calendarId, requestingUser.id);
        if (!calendarMembership
            || !this.calendarPolicy.userCanEditCalendarMetadata(calendarMembership)) {
            throw Boom.unauthorized("You cannot access this Calendar");
        }

        // Retrieve Calendar
        const calendar = await this.calendarRepository.getCalendar(calendarId);
        if (!calendar) {
            throw Boom.notFound("Calendar does not exists");
        }

        // Edit Calendar
        calendar.color = calendarNewColor;
        calendar.name = calendarNewName;
        const updatedCalendar = await this.calendarRepository.updateCalendar(calendar);

        res.status(200).json({
            message: "OK",
            calendar: this.calendarView.formatCalendarWithMembership(updatedCalendar, calendarMembership)
        });
    };

    public readonly getAllCalendarsOfRequestingUser = async (req: Request, res: Response) => {
        const requestingUser = getRequestingUser(req);

        // Validate request's parameters
        const invitationStatusQuery: string = req.query.invitation_status;

        const options: { invitationConfirmed?: boolean } = {};
        // Process query option: "invitation_status"
        if (invitationStatusQuery !== undefined) {
            const invitationStatus = calendarInvitationStatusFromString(invitationStatusQuery);
            if (invitationStatus === undefined) {
                throw Boom.badRequest(`Invalid invitation_status: "${invitationStatusQuery}"`);
            }
            options.invitationConfirmed = invitationStatus === CalendarInvitationStatus.Confirmed;
        }

        // Retrieve Calendars
        const calendarMembers = await this.calendarRepository.getAllCalendarsForUserId(requestingUser.id, options);

        res.status(200).json({
            message: "OK",
            calendars: calendarMembers.map(this.calendarView.formatCalendarFromMembership)
        });
    };

    public readonly addEventToCalendar = async (req: Request, res: Response) => {
        const requestingUser = getRequestingUser(req);

        // Validate request's parameters
        const calendarId: number = parseInt(req.params.calendarId, 10);
        if (isNaN(calendarId)) {
            throw Boom.notFound(`Calendar id "${req.params.calendarId}" is invalid`);
        }
        const eventId: number = parseInt(req.body.event_id, 10);
        if (isNaN(eventId)) {
            throw Boom.badRequest("Missing valid event_id");
        }

        // Make sure User can add Event to this Calendar
        const calendarMembership = await this.calendarRepository.getCalendarMemberShip(calendarId, requestingUser.id);
        if (!calendarMembership
            || !this.calendarPolicy.userCanAddEventToCalendar(calendarMembership)) {
            throw Boom.unauthorized("You cannot add Event to this Calendar");
        }

        // Retrieve Calendar with members
        const calendar = await this.calendarRepository.getCalendarWithMembers(calendarId);
        if (!calendar) {
            throw Boom.notFound("Calendar not found");
        }

        // Make sure Event can be added to Calendars
        const event = await this.eventRepository.getEventWithAttendees(eventId);
        if (!event
            || !this.eventPolicy.eventIsPublic(event)) {
            throw Boom.unauthorized("You cannot add this Event to Calendars");
        }

        // Make sure Event is not already in Calendar
        const alreadyExistingCalendarEntry = await this.calendarRepository.getCalendarEntry(calendarId, event.id);
        if (alreadyExistingCalendarEntry) {
            throw Boom.conflict("This Event is already in this Calendar");
        }

        // Add Event to Calendar
        await this.calendarRepository.addEventToCalendar(calendar, { event: event });

        // Create new attendees
        const existingAttendees = new Set<number>(event.attendees!.map(e => e.userId));
        const newAttendees = calendar.members!
            .filter(m => !existingAttendees.has(m.member!.id))
            .map(m => ({
                user: m.member!,
                role: EventAttendeeRole.Spectator,
                status: EventAttendeeStatus.Invited
            }));
        await this.eventRepository.addUsersToEvent(event, newAttendees)

        res.status(200).json({
            message: "Event added to Calendar"
        });
    };

    public readonly removeEventFromCalendar = async (req: Request, res: Response) => {
        const requestingUser = getRequestingUser(req);

        // Validate request's parameters
        const calendarId: number = parseInt(req.params.calendarId, 10);
        if (isNaN(calendarId)) {
            throw Boom.notFound(`Calendar id "${req.params.calendarId}" is invalid`);
        }
        const eventId: number = parseInt(req.params.eventId, 10);
        if (isNaN(eventId)) {
            throw Boom.notFound(`Event id "${req.params.eventId}" is invalid`);
        }

        // Make sure User can remove Event from this Calendar
        const calendarMembership = await this.calendarRepository.getCalendarMemberShip(calendarId, requestingUser.id);
        if (!calendarMembership
            || !this.calendarPolicy.userCanRemoveEventFromCalendar(calendarMembership)) {
            throw Boom.unauthorized("You cannot remove Event from this Calendar");
        }

        // Check if Event is in this Calendar
        const calendarEntry = await this.calendarRepository.getCalendarEntry(calendarId, eventId);
        if (!calendarEntry) {
            throw Boom.notFound("This Event is not part of this Calendar");
        }

        // Remove Event from Calendar
        await this.calendarRepository.removeEventFromCalendar(calendarEntry.calendarId, calendarEntry.eventId);

        res.status(200).json({
            message: "Event removed from Calendar"
        });
    };

    public readonly deleteCalendar = async (req: Request, res: Response) => {
        const requestingUser = getRequestingUser(req);

        // Validate request's parameters
        const calendarId: number = parseInt(req.params.calendarId, 10);
        if (isNaN(calendarId)) {
            throw Boom.notFound(`Calendar id "${req.params.calendarId}" is invalid`);
        }

        // Make sure User can access Calendar
        const calendarMembership = await this.calendarRepository.getCalendarMemberShip(calendarId, requestingUser.id);
        if (!calendarMembership
            || !this.calendarPolicy.userCanDeleteCalendar(calendarMembership)) {
            throw Boom.unauthorized("You cannot access this Calendar");
        }

        // Retrieve Calendar
        const calendar = await this.calendarRepository.getCalendar(calendarId);
        if (!calendar) {
            throw Boom.notFound("Calendar does not exists");
        }

        // Delete Calendar
        await this.calendarRepository.deleteCalendar(calendar.id);

        res.status(200).json({
            message: "Calendar deleted"
        });
    };
}


export default CalendarController;
