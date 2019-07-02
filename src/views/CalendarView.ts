import CalendarMember from "../models/entities/CalendarMember";


class CalendarView {

    public readonly formatCalendarRecapWithMembership = (calendarMember: CalendarMember): any => {
        if (!calendarMember.calendar) {
            throw new Error("Missing Calendar information");
        }

        return {
            // Calendar
            name: calendarMember.calendar.name,
            color: calendarMember.calendar.color,

            // Membership
            role: calendarMember.role,
            invitation_confirmed: calendarMember.invitationConfirmed
        };
    };
}


export default CalendarView;
