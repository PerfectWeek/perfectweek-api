import { CalendarMember } from "../models/entities/CalendarMember";

import { CalendarMemberRole } from "../core/enums/CalendarMemberRole";

export class CalendarPolicy {

    public readonly userCanReadCalendar = (_calendarMembership: CalendarMember): boolean => {
        return true; // Always true since calendarMembership exists
    }

    public readonly userCanEditCalendarMetadata = (calendarMembership: CalendarMember): boolean => {
        return CalendarPolicy.memberIsAdmin(calendarMembership);
    }

    public readonly userCanAddEventToCalendar = (calendarMembership: CalendarMember): boolean => {
        return CalendarPolicy.memberIsAtLeastActor(calendarMembership);
    }

    public readonly userCanRemoveEventFromCalendar = (calendarMembership: CalendarMember): boolean => {
        return CalendarPolicy.memberIsAtLeastActor(calendarMembership);
    }

    public readonly userCanDeleteCalendar = (calendarMembership: CalendarMember): boolean => {
        return CalendarPolicy.memberIsAdmin(calendarMembership);
    }

    public readonly userCanInviteMembers = (calendarMembership: CalendarMember): boolean => {
        return CalendarPolicy.memberIsAdmin(calendarMembership);
    }

    public readonly userCanEditMembers = (calendarMembership: CalendarMember): boolean => {
        return CalendarPolicy.memberIsAdmin(calendarMembership);
    }

    //
    // Helpers
    //
    private static memberIsAdmin(calendarMembership: CalendarMember): boolean {
        return calendarMembership.invitationConfirmed
            && calendarMembership.role === CalendarMemberRole.Admin;
    }

    private static memberIsAtLeastActor(calendarMembership: CalendarMember): boolean {
        return calendarMembership.invitationConfirmed
            && (
                calendarMembership.role === CalendarMemberRole.Admin
                || calendarMembership.role === CalendarMemberRole.Actor
            );
    }
}
