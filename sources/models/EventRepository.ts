import { Connection } from "typeorm";

import EventAttendeeRole from "../core/enums/EventAttendeeRole";
import EventAttendeeStatus from "../core/enums/EventAttendeeStatus";

import Calendar from "./entities/Calendar";
import CalendarEntry from "./entities/CalendarEntry";
import Event from "./entities/Event";
import EventAttendee from "./entities/EventAttendee";
import User from "./entities/User";


class EventRepository {

    private readonly conn: Connection;

    constructor(conn: Connection) {
        this.conn = conn;
    }

    public readonly createEvent = async (
        event: Event,
        attendeesOptions: AttendeeOptions[],
        calendarOptions?: CalendarOptions
    ): Promise<Event> => {
        // Created Event
        const createdEvent = await this.conn
            .getRepository(Event)
            .save(event);

        // Create EventAttendees
        const attendees = attendeesOptions.map(options => new EventAttendee({
            eventId: createdEvent.id,
            userId: options.user.id,
            role: options.role,
            status: options.status
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
                    eventId: event.id
                }));
            calendarEntry.calendar = calendarOptions.calendar;
            calendarEntry.event = createdEvent;

            createdEvent.owningCalendars = [calendarEntry];
        }
        else {
            createdEvent.owningCalendars = [];
        }

        return createdEvent;
    };

    public readonly getAllEventsForUserWithCalendars = (
        userId: number,
        eventOptions?: EventOptions
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
                        { ids: eventOptions.exceptCalendarIds }
                    );
            }
            if (eventOptions.onlyStatuses) {
                query = query
                    .andWhere("ea.status IN (:...statuses)", { statuses: eventOptions.onlyStatuses });
            }
        }

        return query.getMany();
    };

    public readonly inviteUsersToEvent = (
        event: Event,
        attendeeOptions: AttendeeOptions[]
    ): Promise<EventAttendee[]> => {
        const attendees = attendeeOptions.map(options => new EventAttendee({
            eventId: event.id,
            userId: options.user.id,
            role: options.role,
            status: options.status
        }));

        return this.conn
            .getRepository(EventAttendee)
            .save(attendees);
    };
};

type AttendeeOptions = {
    user: User,
    role: EventAttendeeRole,
    status: EventAttendeeStatus
};

type CalendarOptions = {
    calendar: Calendar
};

type EventOptions = {
    afterDate?: Date,
    beforeDate?: Date,
    onlyCalendarIds?: number[],
    exceptCalendarIds?: number[],
    onlyStatuses?: EventAttendeeStatus[]
};


//
// Helpers
//
function putAttendeeInEventAttendee(
    eventAttendee: EventAttendee,
    attendees: Map<number, User>
): EventAttendee {
    const matchingAttendee = attendees.get(eventAttendee.userId);

    if (!matchingAttendee) {
        throw new Error("No matching attendee found");
    }

    eventAttendee.attendee = matchingAttendee;
    return eventAttendee;
}


export default EventRepository;
