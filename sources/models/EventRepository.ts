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
                    eventId: event.id,
                    color: calendarOptions.color
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
};

type AttendeeOptions = {
    user: User,
    role: EventAttendeeRole,
    status: EventAttendeeStatus
};

type CalendarOptions = {
    calendar: Calendar,
    color: string
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
