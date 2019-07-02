import { Entity, PrimaryColumn, Index, Column } from "typeorm";

import Calendar from "./Calendar";
import Event from "./Event";


@Entity("calendar_entries")
class CalendarEntry {

    @PrimaryColumn({ name: "calendar_id" })
    public calendarId: number;

    @PrimaryColumn({ name: "event_id" })
    @Index()
    public eventId: number;

    @Column()
    public color: string;

    public calendar?: Calendar;
    public event?: Event;

    constructor(data?: CalendarEntryData) {
        this.calendarId = data && data.calendarId || 0;
        this.eventId = data && data.eventId || 0;
        this.color = data && data.color || "";

        this.calendar = undefined;
        this.event = undefined;
    }
}

type CalendarEntryData = {
    calendarId: number,
    eventId: number,
    color: string
};


export default CalendarEntry;
