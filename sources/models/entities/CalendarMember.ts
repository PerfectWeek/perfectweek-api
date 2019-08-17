import { Column, Entity, Index, PrimaryColumn } from "typeorm";

import { CalendarMemberRole } from "../../core/enums/CalendarMemberRole";

import { Calendar } from "./Calendar";
import { User } from "./User";

@Entity("calendar_members")
export class CalendarMember {

    private static readonly DEFAULT_ROLE: CalendarMemberRole = CalendarMemberRole.Admin;

    @PrimaryColumn({ name: "user_id" })
    public userId: number;

    @PrimaryColumn({ name: "calendar_id" })
    @Index()
    public calendarId: number;

    @Column({ default: CalendarMember.DEFAULT_ROLE })
    public role: CalendarMemberRole;

    @Column({ name: "invitation_confirmed" })
    public invitationConfirmed: boolean;

    public calendar?: Calendar;
    public member?: User;

    constructor(data?: CalendarMemberData) {
        this.userId = data && data.userId || 0;
        this.calendarId = data && data.calendarId || 0;
        this.role = data && data.role || CalendarMember.DEFAULT_ROLE;
        this.invitationConfirmed = data ? data.invitationConfirmed : true;

        this.calendar = undefined;
        this.member = undefined;
    }
}

type CalendarMemberData = {
    userId: number,
    calendarId: number,
    role: CalendarMemberRole,
    invitationConfirmed: boolean,
};
