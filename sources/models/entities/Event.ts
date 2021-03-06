import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

import { EventType } from "../../core/enums/EventType";
import { EventVisibility } from "../../core/enums/EventVisibility";

import { CalendarEntry } from "./CalendarEntry";
import { EventAttendee } from "./EventAttendee";

@Entity("events")
export class Event {

    private static readonly DEFAULT_TYPE: EventType = EventType.Work;
    private static readonly DEFAULT_VISIBILITY: EventVisibility = EventVisibility.Private;
    private static readonly DEFAULT_COLOR: string = "#5abc95";

    @PrimaryGeneratedColumn()
    public id: number;

    @Column()
    public name: string;

    @Column()
    public description: string;

    @Column({ type: "timestamp with time zone", name: "start_time" })
    public startTime: Date;

    @Column({ type: "timestamp with time zone", name: "end_time" })
    public endTime: Date;

    @Column()
    public type: EventType;

    @Column()
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
        this.type = data && data.type || Event.DEFAULT_TYPE;
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
    type: EventType,
    location?: string,
    visibility: EventVisibility,
    color: string,
};
