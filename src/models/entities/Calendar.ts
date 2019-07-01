import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

import { baseTimeSlotPreferences, TimeSlotPreferences } from "../../core/utils/TimeSlotPreferences";


@Entity("calendars")
class Calendar {

    @PrimaryGeneratedColumn()
    public id: number;

    @Column()
    public name: string;

    @Column({
        name: "time_slot_preferences",
        type: "simple-json",
        default: baseTimeSlotPreferences
    })
    public timeSlotPreferences: TimeSlotPreferences;

    constructor(data?: CalendarData) {
        this.id = 0;
        this.name = data && data.name || "";
        this.timeSlotPreferences = baseTimeSlotPreferences;
    }
}

type CalendarData = {
    name: string
};


export default Calendar;
