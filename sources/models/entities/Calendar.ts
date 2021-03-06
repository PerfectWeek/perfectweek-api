import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

import { BASE_TIME_SLOT_PREFERENCES, ITimeSlotPreferences } from "../../core/utils/TimeSlotPreferences";

import { CalendarEntry } from "./CalendarEntry";
import { CalendarMember } from "./CalendarMember";

@Entity("calendars")
export class Calendar {

    private static readonly DEFAULT_COLOR: string = "#5abc95";

    @PrimaryGeneratedColumn()
    public id: number;

    @Column()
    public name: string;

    @Column({ default: Calendar.DEFAULT_COLOR })
    public color: string;

    @Column({ name: "google_calendar_sync_token", type: "varchar", nullable: true, default: null })
    public googleCalendarSyncToken: string | null;

    @Column({
        type: "simple-json",
        name: "time_slot_preferences",
        default: BASE_TIME_SLOT_PREFERENCES,
    })
    public timeSlotPreferences: ITimeSlotPreferences;

    public entries?: CalendarEntry[];
    public members?: CalendarMember[];

    constructor(data?: CalendarData) {
        this.id = 0;
        this.name = data && data.name || "";
        this.color = data && data.color || Calendar.DEFAULT_COLOR;
        this.googleCalendarSyncToken = null;
        this.timeSlotPreferences = BASE_TIME_SLOT_PREFERENCES;

        this.entries = undefined;
        this.members = undefined;
    }
}

type CalendarData = {
    name: string,
    color?: string,
};
