import { Connection } from "typeorm";

import Calendar from "./entities/Calendar";
import CalendarMember from "./entities/CalendarMember";
import CalendarMemberRole from "../core/enums/CalendarMemberRole";
import User from "../models/entities/User";


class CalendarRepository {

    private readonly conn: Connection;

    constructor(conn: Connection) {
        this.conn = conn;
    }

    public readonly createCalendar = async (
        calendar: Calendar,
        membersOptions: MemberOptions[]
    ): Promise<Calendar> => {
        // Create Calendar
        const createdCalendar = await this.conn
            .getRepository(Calendar)
            .save(calendar);

        // Create CalendarMembers
        const members = membersOptions.map(options => new CalendarMember({
            calendarId: createdCalendar.id,
            userId: options.user.id,
            role: options.role,
            invitationConfirmed: options.invitationConfirmed
        }));
        const createdMembers = await this.conn
            .getRepository(CalendarMember)
            .save(members);

        // Process createdMembers so that its "member" attribute is correct
        const users = new Map<number, User>(membersOptions.map(mo => [mo.user.id, mo.user]));
        createdCalendar.members = createdMembers.map(cm => putMembersInCalendarMember(cm, users));

        return createdCalendar;
    };

    public readonly getAllCalendarsForUserId = async (userId: number): Promise<CalendarMember[]> => {
        return this.conn
            .getRepository(CalendarMember)
            .createQueryBuilder("cm")
            .innerJoinAndMapOne("cm.calendar", "calendars", "c", "cm.calendar_id = c.id")
            .where("cm.user_id = :userId", { userId: userId })
            .getMany();
    };
}

type MemberOptions = {
    user: User,
    role: CalendarMemberRole,
    invitationConfirmed: boolean
};


//
// Helpers
//
function putMembersInCalendarMember(
    calendarMember: CalendarMember,
    members: Map<number, User>
): CalendarMember {
    const matchingMember = members.get(calendarMember.userId);

    if (!matchingMember) {
        throw new Error("No matching member found");
    }

    calendarMember.member = matchingMember;
    return calendarMember;
}


export default CalendarRepository;
