import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

import EventVisibility from "../../core/enums/EventVisibility";

import CalendarEntry from "./CalendarEntry";
import EventAttendee from "./EventAttendee";


@Entity("events")
class Event {

    private static readonly DEFAULT_VISIBILITY: EventVisibility = EventVisibility.Private;
    private static readonly DEFAULT_COLOR: string = "#5abc95";

    @PrimaryGeneratedColumn()
    public id: number;

    @Column()
    public name: string;

    @Column({ nullable: true, default: null })
    public description: string;

    @Column({ name: "start_type" })
    public startTime: Date;

    @Column({ name: "end_time" })
    public endTime: Date;

    @Column()
    public type: string;

    @Column({ nullable: true, default: null })
    public location: string;

    @Column({ default: Event.DEFAULT_VISIBILITY })
    public visibility: EventVisibility;

    @Column({ default: Event.DEFAULT_COLOR })
    public color: string;

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
        this.color = data && data.color || Event.DEFAULT_COLOR;

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
    visibility: EventVisibility,
    color?: string
};


export default Event;