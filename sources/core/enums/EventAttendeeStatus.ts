export enum EventAttendeeStatus {
    Going = "going",
    Maybe = "maybe",
    NotGoing = "no",
    Invited = "invited",
    None = "none",      // Member of the Calendar but not related to the Event
}

export function eventAttendeeStatusFromString(status: string): EventAttendeeStatus | undefined {
    switch (status) {
        case EventAttendeeStatus.Going: return EventAttendeeStatus.Going;
        case EventAttendeeStatus.Maybe: return EventAttendeeStatus.Maybe;
        case EventAttendeeStatus.NotGoing: return EventAttendeeStatus.NotGoing;
        case EventAttendeeStatus.Invited: return EventAttendeeStatus.Invited;
        case EventAttendeeStatus.None: return EventAttendeeStatus.None;
        default: return undefined;
    }
}
