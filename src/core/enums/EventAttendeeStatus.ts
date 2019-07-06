enum EventAttendeeStatus {
    Going = "going",
    Maybe = "maybe",
    No = "no",
    Invited = "invited"
};


export function eventAttendeeStatusFromString(status: string): EventAttendeeStatus | undefined {
    switch (status) {
        case EventAttendeeStatus.Going: return EventAttendeeStatus.Going;
        case EventAttendeeStatus.Maybe: return EventAttendeeStatus.Maybe;
        case EventAttendeeStatus.No: return EventAttendeeStatus.No;
        case EventAttendeeStatus.Invited: return EventAttendeeStatus.Invited;
        default: return undefined;
    }
}


export default EventAttendeeStatus;
