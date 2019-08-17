import { Calendar } from "../models/entities/Calendar";
import { CalendarMember } from "../models/entities/CalendarMember";

export class CalendarView {

    public readonly formatCalendar = (calendar: Calendar): any => {
        return {
            color: calendar.color,
            id: calendar.id,
            name: calendar.name,
        };
    }

    public readonly formatCalendarWithMembership = (
        calendar: Calendar,
        membership: CalendarMember,
    ): any => {
        return {
            // Calendar
            ...this.formatCalendar(calendar),
            // Membership
            ...CalendarView.formatMemberShipStatus(membership),
        };
    }

    public readonly formatCalendarMember = (membership: CalendarMember): any => {
        if (!membership.member) {
            throw new Error("Missing CalendarMember.member information");
        }

        return {
            // Member
            id: membership.userId,
            name: membership.member.name,
            // Membership
            ...CalendarView.formatMemberShipStatus(membership),
        };
    }

    public readonly formatCalendarFromMembership = (membership: CalendarMember): any => {
        if (!membership.calendar) {
            throw new Error("Missing CalendarMember.calendar information");
        }

        return {
            // Calendar
            ...this.formatCalendar(membership.calendar),
            // Membership
            ...CalendarView.formatMemberShipStatus(membership),
        };
    }

    public readonly formatCalendarWithMembershipAndMembers = (
        calendar: Calendar,
        membership: CalendarMember,
    ): any => {
        if (!calendar.members) {
            throw new Error("Missing Calendar.members information");
        }

        return {
            // Calendar
            ...this.formatCalendarWithMembership(calendar, membership),
            // Members
            members: calendar.members.map(this.formatCalendarMember),
        };
    }

    private static formatMemberShipStatus(membership: CalendarMember): any {
        return {
            invitation_confirmed: membership.invitationConfirmed,
            role: membership.role,
        };
    }
}
