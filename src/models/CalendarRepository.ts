import { Connection } from "typeorm";

import CalendarMember from "./entities/CalendarMember";


class CalendarRepository {

    private readonly conn: Connection;

    constructor(conn: Connection) {
        this.conn = conn;
    }

    public readonly getAllCalendarsForUserId = async (userId: number): Promise<CalendarMember[]> => {
        return this.conn
            .getRepository(CalendarMember)
            .createQueryBuilder("cm")
            .innerJoinAndMapOne("cm.calendar", "calendars", "c", "cm.calendar_id = c.id")
            .where("cm.user_id = :userId", { userId: userId })
            .getMany();
    };
}


export default CalendarRepository;
