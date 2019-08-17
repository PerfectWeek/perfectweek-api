export enum EventAttendeeRole {
    Admin = "admin",
    Actor = "actor",
    Spectator = "spectator",
}

export function eventAttendeeRoleFromString(role: string): EventAttendeeRole | undefined {
    switch (role) {
        case EventAttendeeRole.Actor: return EventAttendeeRole.Actor;
        case EventAttendeeRole.Admin: return EventAttendeeRole.Admin;
        case EventAttendeeRole.Spectator: return EventAttendeeRole.Spectator;
        default: return undefined;
    }
}
