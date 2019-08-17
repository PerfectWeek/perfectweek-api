import { Connection } from "typeorm";

import { EventAttendeeRole } from "../core/enums/EventAttendeeRole";
import { EventAttendeeStatus } from "../core/enums/EventAttendeeStatus";

import { Calendar } from "./entities/Calendar";
import { CalendarEntry } from "./entities/CalendarEntry";
import { Event } from "./entities/Event";
import { EventAttendee } from "./entities/EventAttendee";
import { User } from "./entities/User";

export class EventRepository {

    private readonly conn: Connection;

    constructor(conn: Connection) {
        this.conn = conn;
    }

    public readonly createEvent = async (
        event: Event,
        attendeesOptions: AttendeeOptions[],
        calendarOptions?: CalendarOptions,
    ): Promise<Event> => {
        // Created Event
        const createdEvent = await this.conn
            .getRepository(Event)
            .save(event);

        // Create EventAttendees
        const attendees = attendeesOptions.map(options => new EventAttendee({
            eventId: createdEvent.id,
            role: options.role,
            status: options.status,
            userId: options.user.id,
        }));
        const createdAttendees = await this.conn
            .getRepository(EventAttendee)
            .save(attendees);

        // Process createdAttendees so that its "attendees" attribute is correct
        const users = new Map<number, User>(attendeesOptions.map(mo => [mo.user.id, mo.user]));
        createdEvent.attendees = createdAttendees.map(ea => putAttendeeInEventAttendee(ea, users));

        if (calendarOptions) {
            const calendarEntry = await this.conn
                .getRepository(CalendarEntry)
                .save(new CalendarEntry({
                    calendarId: calendarOptions.calendar.id,
                    eventId: event.id,
                }));
            calendarEntry.calendar = calendarOptions.calendar;
            calendarEntry.event = createdEvent;

            createdEvent.owningCalendars = [calendarEntry];
        }
        else {
            createdEvent.owningCalendars = [];
        }

        return createdEvent;
    }

    public readonly getEventRelationship = async (
        eventId: number,
        userId: number,
    ): Promise<EventAttendee | undefined> => {
        return this.conn
            .getRepository(EventAttendee)
            .findOne({ where: { eventId: eventId, userId: userId } });
    }

    public readonly getEventWithAttendees = async (eventId: number): Promise<Event | undefined> => {
        return this.conn
            .getRepository(Event)
            .createQueryBuilder("e")
            .innerJoinAndMapMany("e.attendees", "event_attendees", "ea", "e.id = ea.event_id")
            .innerJoinAndMapOne("ea.attendee", "users", "u", "ea.user_id = u.id")
            .where("e.id = :id", { id: eventId })
            .getOne();
    }

    public readonly getEventWithAttendeesAndCalendarsForUser = async (
        eventId: number,
        userId: number,
    ): Promise<Event | undefined> => {
        const event = await this.conn
            .getRepository(Event)
            .createQueryBuilder("e")
            .innerJoinAndMapMany("e.attendees", "event_attendees", "ea", "e.id = ea.event_id")
            .innerJoinAndMapOne("ea.attendee", "users", "u", "ea.user_id = u.id")
            .where("e.id = :id", { id: eventId })
            .getOne();

        if (event) {
            event.owningCalendars = await this.conn
                .getRepository(CalendarEntry)
                .createQueryBuilder("ce")
                .innerJoinAndMapOne("ce.calendar", "calendars", "c", "ce.calendar_id = c.id")
                .innerJoin("calendar_members", "cm", "c.id = cm.calendar_id")
                .where("ce.event_id = :eventId", { eventId: eventId })
                .andWhere("cm.user_id = :userId", { userId: userId })
                .getMany();
        }

        return event;
    }

    public readonly getAllEventsForUserWithCalendars = async (
        userId: number,
        eventOptions?: EventOptions,
    ): Promise<EventAttendee[]> => {
        let query = this.conn
            .getRepository(EventAttendee)
            .createQueryBuilder("ea")
            .innerJoinAndMapOne("ea.event", "events", "e", "ea.event_id = e.id")
            .where("ea.user_id = :id", { id: userId })
            .leftJoinAndMapMany("e.owningCalendars", "calendar_entries", "ce", "ce.event_id = e.id")
            .leftJoinAndMapOne("ce.calendar", "calendars", "c", "c.id = ce.calendar_id");

        if (eventOptions) {
            if (eventOptions.afterDate) {
                query = query
                    .andWhere("e.end_time >= :afterDate", { afterDate: eventOptions.afterDate });
            }
            if (eventOptions.beforeDate) {
                query = query
                    .andWhere("e.start_time <= :beforeDate", { beforeDate: eventOptions.beforeDate });
            }
            if (eventOptions.onlyCalendarIds) {
                query = query
                    .andWhere("ce.calendar_id IN (:...ids)", { ids: eventOptions.onlyCalendarIds });
            }
            if (eventOptions.exceptCalendarIds) {
                query = query
                    .andWhere(
                        "(ce.calendar_id IS NULL OR ce.calendar_id NOT IN (:...ids))",
                        { ids: eventOptions.exceptCalendarIds },
                    );
            }
            if (eventOptions.onlyStatuses) {
                query = query
                    .andWhere("ea.status IN (:...statuses)", { statuses: eventOptions.onlyStatuses });
            }
        }

        return query.getMany();
    }

    public readonly addUsersToEvent = async (
        event: Event,
        attendeeOptions: AttendeeOptions[],
    ): Promise<EventAttendee[]> => {
        const attendees = attendeeOptions.map(options => new EventAttendee({
            eventId: event.id,
            role: options.role,
            status: options.status,
            userId: options.user.id,
        }));

        return this.conn
            .getRepository(EventAttendee)
            .save(attendees);
    }
}

type AttendeeOptions = {
    user: User,
    role: EventAttendeeRole,
    status: EventAttendeeStatus,
};

type CalendarOptions = {
    calendar: Calendar,
};

type EventOptions = {
    afterDate?: Date,
    beforeDate?: Date,
    onlyCalendarIds?: number[],
    exceptCalendarIds?: number[],
    onlyStatuses?: EventAttendeeStatus[],
};

//
// Helpers
//
function putAttendeeInEventAttendee(
    eventAttendee: EventAttendee,
    attendees: Map<number, User>,
): EventAttendee {
    const matchingAttendee = attendees.get(eventAttendee.userId);

    if (!matchingAttendee) {
        throw new Error("No matching attendee found");
    }

    eventAttendee.attendee = matchingAttendee;
    return eventAttendee;
}
