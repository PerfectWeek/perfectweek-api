import { Connection } from "typeorm";

import Calendar from "./entities/Calendar";
import CalendarMember from "./entities/CalendarMember";
import CalendarMemberRole from "../core/enums/CalendarMemberRole";
import EventAttendee from "./entities/EventAttendee";
import User from "./entities/User";
import UserFriendship from "./entities/UserFriendship";


class UserRepository {

    private static readonly DEFAULT_CALENDAR_NAME: string = "Main calendar";

    private readonly conn: Connection;

    constructor(conn: Connection) {
        this.conn = conn;
    }

    public readonly createUser = async (user: User): Promise<User> => {
        return this.conn
            .getRepository(User)
            .save(user);
    };

    public readonly getUserByEmail = async (email: string): Promise<User | undefined> => {
        return this.conn
            .getRepository(User)
            .findOne({ where: { email: email } });
    };

    public readonly getUserById = async (id: number): Promise<User | undefined> => {
        return this.conn
            .getRepository(User)
            .findOne({ where: { id: id } });
    };

    public readonly updateUser = async (user: User): Promise<User> => {
        return this.conn
            .getRepository(User)
            .save(user);
    };

    public readonly createDefaultCalendarForUser = async (user: User): Promise<void> => {
        const calendar = await this.conn
            .getRepository(Calendar)
            .save(new Calendar({
                name: UserRepository.DEFAULT_CALENDAR_NAME
            }));
        await this.conn
            .getRepository(CalendarMember)
            .save(new CalendarMember({
                calendarId: calendar.id,
                userId: user.id,
                role: CalendarMemberRole.Admin,
                invitationConfirmed: true
            }));
    };

    public readonly deleteUser = async (userId: number): Promise<void> => {
        await this.conn.transaction(async entityManager => {
            // Delete Friendships
            await entityManager.delete(UserFriendship, { requestingId: userId });
            await entityManager.delete(UserFriendship, { requestedId: userId });
            // Delete Event relations
            await entityManager.delete(EventAttendee, { userId: userId });
            // Delete Calendar relations
            await entityManager.delete(CalendarMember, { userId: userId });
            // Delete User
            await entityManager.delete(User, { id: userId });
        });
    };
}


export default UserRepository;
