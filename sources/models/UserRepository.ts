import { Connection } from "typeorm";

import { CalendarMemberRole } from "../core/enums/CalendarMemberRole";

import { Calendar } from "./entities/Calendar";
import { CalendarMember } from "./entities/CalendarMember";
import { EventAttendee } from "./entities/EventAttendee";
import { User } from "./entities/User";
import { UserFriendship } from "./entities/UserFriendship";

export class UserRepository {

    private static readonly DEFAULT_CALENDAR_NAME: string = "Main calendar";

    private readonly conn: Connection;

    constructor(conn: Connection) {
        this.conn = conn;
    }

    public readonly createUser = async (user: User): Promise<User> => {
        return this.conn
            .getRepository(User)
            .save(user);
    }

    public readonly getUserByEmail = async (email: string): Promise<User | undefined> => {
        return this.conn
            .getRepository(User)
            .findOne({ where: { email: email } });
    }

    public readonly getUserById = async (id: number): Promise<User | undefined> => {
        return this.conn
            .getRepository(User)
            .findOne({ where: { id: id } });
    }

    public readonly updateUser = async (user: User): Promise<User> => {
        return this.conn
            .getRepository(User)
            .save(user);
    }

    public readonly createDefaultCalendarForUser = async (user: User): Promise<void> => {
        const calendar = await this.conn
            .getRepository(Calendar)
            .save(new Calendar({
                name: UserRepository.DEFAULT_CALENDAR_NAME,
            }));
        await this.conn
            .getRepository(CalendarMember)
            .save(new CalendarMember({
                calendarId: calendar.id,
                invitationConfirmed: true,
                role: CalendarMemberRole.Admin,
                userId: user.id,
            }));
    }

    public readonly createUserFriendship = async  (
        userFriendship: UserFriendship,
    ): Promise<UserFriendship> => {
        return this.conn
            .getRepository(UserFriendship)
            .save(userFriendship);
    }

    public readonly getUserFriendship = async  (
        requestingUserId: number,
        targetUserId: number,
    ): Promise<UserFriendship | undefined> => {
        return this.conn
            .getRepository(UserFriendship)
            .findOne({
                where: {
                    requestingId: requestingUserId,
                    requestedId: targetUserId,
                },
            });
    }

    public readonly updateUserFriendship = async  (requestingUserId: number,
                                                   targetUserId: number,
                                                   confirmed: boolean): Promise<any> => {
        return this.conn
            .getRepository(UserFriendship)
            .save({requestingId: requestingUserId, requestedId: targetUserId, confirmed: confirmed});
    }

    public readonly deleteUserFriendship = async  (_requestingUser: number, _targetUser: number): Promise<any> => {
        return this.conn
            .getRepository(UserFriendship);
    }

    public readonly getAllFriendsForUserId = async  (_requestingUser: number, _status: boolean): Promise<any> => {
        return ;
    }

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
    }
}
