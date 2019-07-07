import Event from "../models/entities/Event";
import EventAttendee from "../models/entities/EventAttendee";


class EventView {

    public readonly formatEvent = (event: Event): any => {
        return {
            id: event.id,
            name: event.name,
            description: event.description,
            location: event.location,
            start_time: event.startTime,
            end_time: event.endTime,
            type: event.type,
            visibility: event.visibility,
        };
    };

    public readonly formatEventWithStatus = (
        event: Event,
        status: EventAttendee
    ): any => {
        return {
            // Event
            ...this.formatEvent(event),
            // Status
            ...EventView.formatAttendeeStatus(status)
        };
    };

    public readonly formatEventAttendee = (status: EventAttendee): any => {
        if (!status.attendee) {
            throw new Error("Missing EventAttendee.attendee information");
        }

        return {
            // Attendee
            id: status.attendee.id,
            name: status.attendee.name,
            // Status
            ...EventView.formatAttendeeStatus(status)
        }
    }

    public readonly formatEventWithAttendees = (event: Event): any => {
        if (!event.attendees) {
            throw new Error("Missing Event.attendees information");
        }

        return {
            // Event
            ...this.formatEvent(event),
            // Attendees
            attendees: event.attendees.map(this.formatEventAttendee)
        }
    };

    private static formatAttendeeStatus(status: EventAttendee): any {
        return {
            role: status.role,
            status: status.status
        };
    };
}


export default EventView;
