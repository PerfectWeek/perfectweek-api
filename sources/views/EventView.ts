import { CalendarEntry } from "../models/entities/CalendarEntry";
import { Event } from "../models/entities/Event";
import { EventAttendee } from "../models/entities/EventAttendee";

export class EventView {

    public readonly formatEvent = (event: Event): any => {
        return {
            color: event.color,
            description: event.description,
            end_time: event.endTime,
            id: event.id,
            location: event.location,
            name: event.name,
            start_time: event.startTime,
            type: event.type,
            visibility: event.visibility,
        };
    }

    public readonly formatEventWithStatus = (
        event: Event,
        status: EventAttendee,
    ): any => {
        return {
            // Event
            ...this.formatEvent(event),
            // Status
            ...EventView.formatAttendeeStatus(status),
        };
    }

    public readonly formatEventAttendee = (status: EventAttendee): any => {
        if (!status.attendee) {
            throw new Error("Missing EventAttendee.attendee information");
        }

        return {
            // Attendee
            id: status.attendee.id,
            name: status.attendee.name,
            // Status
            ...EventView.formatAttendeeStatus(status),
        };
    }

    public readonly formatEventWithAttendees = (event: Event): any => {
        if (!event.attendees) {
            throw new Error("Missing Event.attendees information");
        }

        return {
            // Event
            ...this.formatEvent(event),
            // Attendees
            attendees: event.attendees.map(this.formatEventAttendee),
        };
    }

    public readonly formatEventWithStatusAndCalendars = (eventStatus: EventAttendee): any => {
        if (!eventStatus.event) {
            throw new Error("Missing EventAttendee.event information");
        }
        if (!eventStatus.event.owningCalendars) {
            throw new Error("Missing Event.owningCalendars information");
        }

        return {
            // Event
            ...this.formatEventWithStatus(eventStatus.event, eventStatus),
            // Calendars
            owning_calendars: eventStatus.event.owningCalendars.map(EventView.formatOwningCalendar),
        };
    }

    public readonly formatEventWithAttendeesAndCalendars = (event: Event): any => {
        if (!event.owningCalendars) {
            throw new Error("Missing Event.owningCalendars information");
        }

        return {
            // Event & Attendees
            ...this.formatEventWithAttendees(event),
            // Calendars
            owning_calendars: event.owningCalendars.map(EventView.formatOwningCalendar),
        };
    }

    private static formatAttendeeStatus(status: EventAttendee): any {
        return {
            role: status.role,
            status: status.status,
        };
    }

    private static formatOwningCalendar(calendarEntry: CalendarEntry): any {
        if (!calendarEntry.calendar) {
            throw new Error("Missing CalendarEntry.calendar information");
        }

        return {
            color: calendarEntry.calendar.color,
            id: calendarEntry.calendar.id,
            name: calendarEntry.calendar.name,
        };
    }
}
