import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

import EventVisibility from "../../core/enums/EventVisibility";

import CalendarEntry from "./CalendarEntry";
import EventAttendee from "./EventAttendee";


@Entity("events")
class Event {

    private static readonly DEFAULT_VISIBILITY: EventVisibility = EventVisibility.Private;

    @PrimaryGeneratedColumn()
    public id: number;

    @Column()
    public name: string;

    @Column()
    public description: string;

    @Column({ name: "start_type", type: "timestamp with time zone" })
    public startTime: Date;

    @Column({ name: "end_time", type: "timestamp with time zone" })
    public endTime: Date;

    @Column()
    public type: string;

    @Column()
    public location: string;

    @Column({ default: Event.DEFAULT_VISIBILITY })
    public visibility: EventVisibility;

    public attendees?: EventAttendee[];
    public owningCalendars?: CalendarEntry[];

    constructor(data?: EventData) {
        this.id = 0;
        this.name = data && data.name || "";
        this.description = data && data.description || "";
        this.startTime = data && data.startTime || new Date();
        this.endTime = data && data.endTime || new Date();
        this.type = data && data.type || "";
        this.location = data && data.location || "";
        this.visibility = data && data.visibility || Event.DEFAULT_VISIBILITY;

        this.attendees = undefined;
        this.owningCalendars = undefined;
    }
}

type EventData = {
    name: string,
    description?: string,
    startTime: Date,
    endTime: Date,
    type: string,
    location?: string,
    visibility: EventVisibility
};


export default Event;
