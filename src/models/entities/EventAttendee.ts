import { Entity, PrimaryColumn, Column, Index } from "typeorm";

import EventAttendeeRole from "../../core/enums/EventAttendeeRole";
import EventAttendeeStatus from "../../core/enums/EventAttendeeStatus";

import Event from "./Event";
import User from "./User";


@Entity("event_attendees")
class EventAttendee {

    private static readonly DEFAULT_ROLE: EventAttendeeRole = EventAttendeeRole.Admin;
    private static readonly DEFAULT_STATUS: EventAttendeeStatus = EventAttendeeStatus.Going;

    @PrimaryColumn({ name: "event_id" })
    public eventId: number;

    @PrimaryColumn({ name: "user_id" })
    @Index()
    public userId: number;

    @Column({ default: EventAttendee.DEFAULT_ROLE })
    public role: EventAttendeeRole;

    @Column({ default: EventAttendee.DEFAULT_STATUS })
    public status: EventAttendeeStatus;

    public event?: Event;
    public attendee?: User;

    constructor(data?: EventAttendeeData) {
        this.eventId = data && data.eventId || 0;
        this.userId = data && data.userId || 0;
        this.role = data && data.role || EventAttendee.DEFAULT_ROLE;
        this.status = data && data.status || EventAttendee.DEFAULT_STATUS;

        this.event = undefined;
        this.attendee = undefined;
    }
}

type EventAttendeeData = {
    eventId: number,
    userId: number,
    role: EventAttendeeRole,
    status: EventAttendeeStatus
};


export default EventAttendee;
