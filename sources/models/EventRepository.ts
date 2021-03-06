import { Connection } from "typeorm";

import { EventAttendeeRole } from "../core/enums/EventAttendeeRole";
import { EventAttendeeStatus } from "../core/enums/EventAttendeeStatus";
import { EventVisibility } from "../core/enums/EventVisibility";

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
        attendeesOptions: AttendeeUserOptions[],
        calendar?: Calendar,
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

        if (calendar) {
            const calendarEntry = await this.conn
                .getRepository(CalendarEntry)
                .save(new CalendarEntry({
                    calendarId: calendar.id,
                    eventId: event.id,
                }));
            calendarEntry.calendar = calendar;
            calendarEntry.event = createdEvent;

            createdEvent.owningCalendars = [calendarEntry];
        }
        else {
            createdEvent.owningCalendars = [];
        }

        return createdEvent;
    }

    public readonly updateEvent = async (event: Event): Promise<Event> => {
        return this.conn.manager.save(event);
    }

    public readonly deleteEvent = async (eventId: number): Promise<void> => {
        await this.conn.transaction(async manager => {
            // Remove Event from all Calendars
            await manager.delete(CalendarEntry, { eventId: eventId });
            // Remove all attendees from Event
            await manager.delete(EventAttendee, { eventId: eventId });
            // Delete Event
            await manager.delete(Event, { id: eventId });
        });
    }

    public readonly getEventById = async (
        eventId: number,
    ): Promise<Event | undefined> => {
        return this.conn
            .getRepository(Event)
            .findOne({ id: eventId });
    }

    public readonly getEventRelationship = async (
        eventId: number,
        userId: number,
        options?: { joinEvent: boolean },
    ): Promise<EventAttendee | undefined> => {
        let query = this.conn
            .getRepository(EventAttendee)
            .createQueryBuilder("ea")
            .where("ea.event_id = :eventId", { eventId: eventId })
            .andWhere("ea.user_id = :userId", { userId: userId });

        if (options !== undefined) {
            if (options.joinEvent) {
                query = query.innerJoinAndMapOne("ea.event", "events", "e", "ea.event_id = e.id");
            }
        }

        return query.getOne();
    }

    public readonly updateEventRelationship = async (
        eventRelationship: EventAttendee,
    ): Promise<EventAttendee> => {
        return this.conn
            .getRepository(EventAttendee)
            .save(eventRelationship);
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

    public readonly getAllEventsForUser = async (
        userId: number,
        eventOptions?: EventOptions,
        withCalendars?: boolean,
    ): Promise<EventAttendee[]> => {
        let query = this.conn
            .getRepository(EventAttendee)
            .createQueryBuilder("ea")
            .innerJoinAndMapOne("ea.event", "events", "e", "ea.event_id = e.id")
            .where("ea.user_id = :id", { id: userId });

        if (withCalendars) {
            query = query
                .leftJoinAndMapMany("e.owningCalendars", "calendar_entries", "ce", "ce.event_id = e.id")
                .leftJoinAndMapOne("ce.calendar", "calendars", "c", "c.id = ce.calendar_id");
        }

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
        attendeeOptions: AttendeeUserOptions[],
    ): Promise<EventAttendee[]> => {
        const attendees = attendeeOptions.map(options => {
            const eventAttendee = new EventAttendee({
                eventId: event.id,
                role: options.role,
                status: options.status,
                userId: options.user.id,
            });
            eventAttendee.event = event;
            eventAttendee.attendee = options.user;
            return eventAttendee;
        });

        return this.conn
            .getRepository(EventAttendee)
            .save(attendees);
    }

    public readonly associateUserToEvents = async (
        user: User,
        attendeeOptions: AttendeeEventOptions[],
    ): Promise<EventAttendee[]> => {
        return this.conn.manager.save(
            attendeeOptions.map(options => new EventAttendee({
                userId: user.id,
                eventId: options.event.id,
                role: options.role,
                status: options.status,
            })),
        );
    }

    public readonly getAllEventFromCalendarWhereUserIsNotPartOf = async (
        calendar: Calendar,
        user: User,
    ): Promise<Event[]> => {
        return this.conn
            .getRepository(Event)
            .createQueryBuilder("e")
            .innerJoin("calendar_entries", "ce", "ce.event_id = e.id")
            .where("ce.calendar_id = :calendarId", { calendarId: calendar.id })
            .andWhere(qb => {
                return "NOT EXISTS " + qb.subQuery()
                    .select()
                    .from(EventAttendee, "ea")
                    .where("ea.event_id = e.id")
                    .andWhere("ea.user_id = :userId", { userId: user.id })
                    .getQuery();
            })
            .getMany();
    }

    public readonly getPublicEvents = async (
        options?: PublicEventOptions,
    ): Promise<Event[]> => {
        let query = this.conn
            .getRepository(Event)
            .createQueryBuilder("e")
            .where("e.visibility = :visibility", { visibility: EventVisibility.Public });

        if (options) {
            if (options.afterDate) {
                query = query
                    .andWhere("e.end_time >= :afterDate", { afterDate: options.afterDate });
            }
            if (options.beforeDate) {
                query = query
                    .andWhere("e.start_time <= :beforeDate", { beforeDate: options.beforeDate });
            }
        }

        return query.getMany();
    }
}

//
// Local types
//
type AttendeeUserOptions = {
    user: User,
    role: EventAttendeeRole,
    status: EventAttendeeStatus,
};

type AttendeeEventOptions = {
    event: Event,
    role: EventAttendeeRole,
    status: EventAttendeeStatus,
};

type EventOptions = {
    afterDate?: Date,
    beforeDate?: Date,
    onlyCalendarIds?: number[],
    exceptCalendarIds?: number[],
    onlyStatuses?: EventAttendeeStatus[],
};

type PublicEventOptions = {
    afterDate?: Date,
    beforeDate?: Date,
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
