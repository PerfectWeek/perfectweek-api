import Event from "../models/entities/Event";
import EventAttendee from "../models/entities/EventAttendee";

import EventVisibility from "../core/enums/EventVisibility";
import EventAttendeeRole from "../core/enums/EventAttendeeRole";


class EventPolicy {

    public readonly eventIsPublic = (event: Event): boolean => {
        return event.visibility === EventVisibility.Public;
    };

    public readonly userCanReadEvent = (_eventStatus: EventAttendee): boolean => {
        return true; // Always true since the relationship exists
    };

    public readonly userCanEditEvent = (eventStatus: EventAttendee): boolean => {
        return eventStatus.role == EventAttendeeRole.Admin
            || eventStatus.role == EventAttendeeRole.Actor;
    };
}


export default EventPolicy;
