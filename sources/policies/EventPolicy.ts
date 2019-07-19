import Event from "../models/entities/Event";
import EventAttendee from "../models/entities/EventAttendee";

import EventVisibility from "../core/enums/EventVisibility";


class EventPolicy {

    public readonly eventIsPublic = (event: Event): boolean => {
        return event.visibility === EventVisibility.Public;
    };

    public readonly userCanReadEvent = (_eventStatus: EventAttendee): boolean => {
        return true; // Always true since the relationship exists
    };
}


export default EventPolicy;
