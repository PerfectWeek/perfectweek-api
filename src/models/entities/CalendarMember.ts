import { Entity, PrimaryColumn, Index, Column } from "typeorm";

import CalendarMemberRole from "../../core/enums/CalendarMemberRole";

import Calendar from "./Calendar";
import User from "./User";


@Entity("calendar_members")
class CalendarMember {

    @PrimaryColumn({ name: "user_id" })
    public userId: number;

    @PrimaryColumn({ name: "calendar_id" })
    @Index()
    public calendarId: number;

    @Column({ default: CalendarMemberRole.Admin })
    public role: CalendarMemberRole;

    @Column({ name: "invitation_confirmed" })
    public invitationConfirmed: boolean;

    public calendar?: Calendar;
    public member?: User;

    constructor(data?: CalendarMemberData) {
        this.userId = data && data.userId || 0;
        this.calendarId = data && data.calendarId || 0;
        this.role = data && data.role || CalendarMemberRole.Admin;
        this.invitationConfirmed = data && data.invitationConfirmed || true;

        this.calendar = undefined;
        this.member = undefined;
    }
}

type CalendarMemberData = {
    userId: number,
    calendarId: number,
    role: CalendarMemberRole,
    invitationConfirmed: boolean
};


export default CalendarMember;
