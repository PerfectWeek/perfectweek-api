import { Entity, Index, PrimaryColumn } from "typeorm";

import { Calendar } from "./Calendar";
import { Event } from "./Event";

@Entity("calendar_entries")
export class CalendarEntry {

    @PrimaryColumn({ name: "calendar_id" })
    public calendarId: number;

    @PrimaryColumn({ name: "event_id" })
    @Index()
    public eventId: number;

    public calendar?: Calendar;
    public event?: Event;

    constructor(data?: CalendarEntryData) {
        this.calendarId = data && data.calendarId || 0;
        this.eventId = data && data.eventId || 0;

        this.calendar = undefined;
        this.event = undefined;
    }
}

type CalendarEntryData = {
    calendarId: number,
    eventId: number,
};
