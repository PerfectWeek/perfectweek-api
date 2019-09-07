import { CalendarMember } from "../models/entities/CalendarMember";

export class CalendarInviteView {

    public readonly formatCalendarInvite = (calendarMember: CalendarMember) => {
        if (!calendarMember.calendar) {
            throw new Error("Missing field CalendarMember.calendar");
        }

        return {
            calendar: {
                id: calendarMember.calendarId,
                name: calendarMember.calendar.name,
            },
            role: calendarMember.role,
        };
    }
}
