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

    /**
     * Saves a new Calendar in the Database
     *
     * @param   calendar        The new Calendar to create
     * @param   membersOptions  A list of members for this new Calendar
     */
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

    /**
     * Retrieve the relationship status between a Calendar and a User.
     *
     * @param   calendarId
     * @param   userId
     */
    public readonly getCalendarMemberShip = async (
        calendarId: number,
        userId: number
    ): Promise<CalendarMember | undefined> => {
        return this.conn
            .getRepository(CalendarMember)
            .findOne({ where: { calendarId: calendarId, userId: userId } });
    };

    /**
     * Retrieve a specific Calendar
     *
     * @param   calendarId
     */
    public readonly getCalendar = async (calendarId: number): Promise<Calendar | undefined> => {
        return this.conn
            .getRepository(Calendar)
            .findOne({ where: { id: calendarId } });
    };

    /**
     * Retrieve a specific Calendar along with all its members
     *
     * @param   calendarId
     */
    public readonly getCalendarWithMembers = async (calendarId: number): Promise<Calendar | undefined> => {
        return this.conn
            .getRepository(Calendar)
            .createQueryBuilder("c")
            .innerJoinAndMapMany("c.members", "calendar_members", "cm", "c.id = cm.calendar_id")
            .innerJoinAndMapOne("cm.member", "users", "u", "cm.user_id = u.id")
            .where("c.id = :calendarId", { calendarId: calendarId })
            .getOne();
    }

    /**
     * Retrieve all existing Calendar for a User.
     * Also returns the ones not yet confirmed.
     *
     * @param   userId  The id of the corresponding User
     */
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
