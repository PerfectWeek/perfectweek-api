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

    public readonly userCanDeleteEvent = (eventStatus: EventAttendee): boolean => {
        return eventStatus.role === EventAttendeeRole.Admin;
    }

    public readonly userCanInviteToEvent = (eventStatus: EventAttendee): boolean => {
        return eventStatus.role === EventAttendeeRole.Admin;
    }

    public readonly userCanEditRoles = (eventStatus: EventAttendee): boolean => {
        return eventStatus.role === EventAttendeeRole.Admin;
    }

    public readonly userCanSetItsRoleTo = (eventStatus: EventAttendee, role: EventAttendeeRole): boolean => {
        switch (eventStatus.role) {
            case EventAttendeeRole.Admin:
                return true;
            case EventAttendeeRole.Actor:
                return role !== EventAttendeeRole.Admin;
            case EventAttendeeRole.Spectator:
                return role === EventAttendeeRole.Spectator;
        }
    }
}
