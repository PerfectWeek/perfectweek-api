import Calendar from "../models/entities/Calendar";
import CalendarMember from "../models/entities/CalendarMember";


class CalendarView {

    public readonly formatCalendarWithMembers = (calendar: Calendar): any => {
        if (!calendar.members) {
            throw new Error("Missing Calendar.members information");
        }

        const members = calendar.members.map(calendarMember => {
            if (!calendarMember.member) {
                throw new Error("Missing Calendar.members.member information");
            }

            return {
                id: calendarMember.userId,
                name: calendarMember.member.name,
                role: calendarMember.role,
                invitation_confirmed: calendarMember.invitationConfirmed
            };
        });

        return {
            id: calendar.id,
            name: calendar.name,
            color: calendar.color,

            members: members
        };
    };

    public readonly formatCalendarRecapWithMembership = (calendarMember: CalendarMember): any => {
        if (!calendarMember.calendar) {
            throw new Error("Missing CalendarMember.calendar information");
        }

        return {
            // Calendar
            id: calendarMember.calendar.id,
            name: calendarMember.calendar.name,
            color: calendarMember.calendar.color,

            // Membership
            role: calendarMember.role,
            invitation_confirmed: calendarMember.invitationConfirmed
        };
    };
}


export default CalendarView;
