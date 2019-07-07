import Calendar from "../models/entities/Calendar";
import CalendarMember from "../models/entities/CalendarMember";


class CalendarView {

    public readonly formatCalendar = (calendar: Calendar): any => {
        return {
            id: calendar.id,
            name: calendar.name,
            color: calendar.color
        };
    };

    public readonly formatCalendarWithMembership = (
        calendar: Calendar,
        membership: CalendarMember
    ): any => {
        return {
            // Calendar
            ...this.formatCalendar(calendar),
            // Membership
            ...CalendarView.formatMemberShipStatus(membership)
        };
    };

    public readonly formatCalendarMember = (membership: CalendarMember): any => {
        if (!membership.member) {
            throw new Error("Missing CalendarMember.member information");
        }

        return {
            // Member
            id: membership.userId,
            name: membership.member.name,
            // Membership
            ...CalendarView.formatMemberShipStatus(membership)
        };
    };

    public readonly formatCalendarFromMembership = (membership: CalendarMember): any => {
        if (!membership.calendar) {
            throw new Error("Missing CalendarMember.calendar information");
        }

        return {
            // Calendar
            ...this.formatCalendar(membership.calendar),
            // Membership
            ...CalendarView.formatMemberShipStatus(membership)
        };
    };

    public readonly formatCalendarWithMembers = (calendar: Calendar): any => {
        if (!calendar.members) {
            throw new Error("Missing Calendar.members information");
        }

        return {
            // Calendar
            ...this.formatCalendar(calendar),
            // Members
            members: calendar.members.map(this.formatCalendarMember)
        };
    };

    private static formatMemberShipStatus(membership: CalendarMember): any {
        return {
            role: membership.role,
            invitation_confirmed: membership.invitationConfirmed
        };
    };
}


export default CalendarView;
