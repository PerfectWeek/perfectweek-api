import { Connection } from "typeorm";

import Calendar from "./entities/Calendar";
import CalendarEntry from "./entities/CalendarEntry";
import CalendarMember from "./entities/CalendarMember";
import CalendarMemberRole from "../core/enums/CalendarMemberRole";
import Event from "./entities/Event";
import User from "../models/entities/User";


class CalendarRepository {

    private readonly conn: Connection;

    constructor(conn: Connection) {
        this.conn = conn;
    }

    /**
     * Save a new Calendar in the Database
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
        createdCalendar.members = createdMembers.map(cm => putMemberInCalendarMember(cm, users));

        return createdCalendar;
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
     * Update Calendar information
     *
     * @param   calendar
     */
    public readonly updateCalendar = async (calendar: Calendar): Promise<Calendar> => {
        return this.conn
            .getRepository(Calendar)
            .save(calendar);
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
    public readonly getAllCalendarsForUserId = async (
        userId: number,
        options?: { invitationConfirmed?: boolean }
    ): Promise<CalendarMember[]> => {
        let query = this.conn
            .getRepository(CalendarMember)
            .createQueryBuilder("cm")
            .innerJoinAndMapOne("cm.calendar", "calendars", "c", "cm.calendar_id = c.id")
            .where("cm.user_id = :userId", { userId: userId });

        if (options
            && options.invitationConfirmed !== undefined) {
            query = query.andWhere("cm.invitation_confirmed = :status", { status: options.invitationConfirmed });
        }

        return query.getMany();
    };

    /**
     * Add an Event to a Calendar
     *
     * @param   calendarId
     * @param   eventOptions
     */
    public readonly addEventToCalendar = async (
        calendar: Calendar,
        eventOptions: EntryOptions
    ): Promise<CalendarEntry> => {
        // Create CalendarEntry
        const entry = await this.conn
            .getRepository(CalendarEntry)
            .save(new CalendarEntry({
                calendarId: calendar.id,
                eventId: eventOptions.event.id
            }));

        // Process entry so that its attributes are correct
        entry.calendar = calendar;
        entry.event = eventOptions.event;

        return entry;
    };

    /**
     * Retrieive relation between a Calendar and an Event
     *
     * @param   calendarId
     * @param   eventId
     */
    public readonly getCalendarEntry = (
        calendarId: number,
        eventId: number
    ): Promise<CalendarEntry | undefined> => {
        return this.conn
            .getRepository(CalendarEntry)
            .findOne({ where: { calendarId: calendarId, eventId: eventId } });
    };

    /**
     * Remove the specified Calendar, taking care of its dependencies
     *
     * @param   calendarId
     */
    public readonly deleteCalendar = async (calendarId: number): Promise<void> => {
        await this.conn.transaction(async entityManager => {
            // Delete all User membership
            await entityManager.delete(CalendarMember, { calendarId: calendarId });
            // Delete all Event relations
            await entityManager.delete(CalendarEntry, { calendarId: calendarId });
            // Delete Calendar
            await entityManager.delete(Calendar, { id: calendarId });
        });
    };
}

type MemberOptions = {
    user: User,
    role: CalendarMemberRole,
    invitationConfirmed: boolean
};

type EntryOptions = {
    event: Event
};


//
// Helpers
//
function putMemberInCalendarMember(
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
