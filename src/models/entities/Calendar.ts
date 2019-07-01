import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

import { baseTimeSlotPreferences, TimeSlotPreferences } from "../../core/utils/TimeSlotPreferences";

import CalendarEntry from "./CalendarEntry";
import CalendarMember from "./CalendarMember";


@Entity("calendars")
class Calendar {

    private static readonly DEFAULT_COLOR: string = "#5abc95";

    @PrimaryGeneratedColumn()
    public id: number;

    @Column()
    public name: string;

    @Column({ default: Calendar.DEFAULT_COLOR })
    public color: string;

    @Column({
        name: "time_slot_preferences",
        type: "simple-json",
        default: baseTimeSlotPreferences
    })
    public timeSlotPreferences: TimeSlotPreferences;

    public entries?: CalendarEntry[];
    public members?: CalendarMember[];

    constructor(data?: CalendarData) {
        this.id = 0;
        this.name = data && data.name || "";
        this.color = data && data.color || Calendar.DEFAULT_COLOR;
        this.timeSlotPreferences = baseTimeSlotPreferences;

        this.entries = undefined;
        this.members = undefined;
    }
}

type CalendarData = {
    name: string,
    color?: string
};


export default Calendar;
