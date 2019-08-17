export enum CalendarMemberRole {
    Admin = "admin",
    Actor = "actor",
    Spectator = "spectator",
}

export function calendarMemberRoleFromString(role: string): CalendarMemberRole | undefined {
    switch (role) {
        case CalendarMemberRole.Actor: return CalendarMemberRole.Actor;
        case CalendarMemberRole.Admin: return CalendarMemberRole.Admin;
        case CalendarMemberRole.Spectator: return CalendarMemberRole.Spectator;
        default: return undefined;
    }
}
