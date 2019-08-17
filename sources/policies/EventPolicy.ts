import { Event } from "../models/entities/Event";
import { EventAttendee } from "../models/entities/EventAttendee";

import { EventAttendeeRole } from "../core/enums/EventAttendeeRole";
import { EventVisibility } from "../core/enums/EventVisibility";

export class EventPolicy {

    public readonly eventIsPublic = (event: Event): boolean => {
        return event.visibility === EventVisibility.Public;
    }

    public readonly userCanReadEvent = (_eventStatus: EventAttendee): boolean => {
        return true; // Always true since the relationship exists
    }

    public readonly userCanEditEvent = (eventStatus: EventAttendee): boolean => {
        return eventStatus.role === EventAttendeeRole.Admin
            || eventStatus.role === EventAttendeeRole.Actor;
    }
}
