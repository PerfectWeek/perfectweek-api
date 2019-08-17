import { CalendarMemberRole } from "../../core/enums/CalendarMemberRole";
import { EventAttendeeRole } from "../../core/enums/EventAttendeeRole";

export function calendarMemberRoleToEventAttendeeRole(calendarMemberRole: CalendarMemberRole): EventAttendeeRole {
    switch (calendarMemberRole) {
        case CalendarMemberRole.Admin: return EventAttendeeRole.Admin;
        case CalendarMemberRole.Actor: return EventAttendeeRole.Actor;
        case CalendarMemberRole.Spectator: return EventAttendeeRole.Spectator;
    }
}
