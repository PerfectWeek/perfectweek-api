import CalendarMember from "../models/entities/CalendarMember";

import CalendarMemberRole from "../core/enums/CalendarMemberRole";


class CalendarPolicy {

    public readonly userCanReadCalendar = (_calendarMembership: CalendarMember): boolean => {
        return true; // Always true since calendarMembership exists
    };

    public readonly userCanEditCalendarMetadata = (calendarMembership: CalendarMember): boolean => {
        return calendarMembership.invitationConfirmed
            && calendarMembership.role === CalendarMemberRole.Admin;
    };

    public readonly userCanAddEventToCalendar = (calendarMembership: CalendarMember): boolean => {
        return calendarMembership.invitationConfirmed
            && (
                calendarMembership.role === CalendarMemberRole.Admin
                || calendarMembership.role === CalendarMemberRole.Actor
            );
    };
}


export default CalendarPolicy;
