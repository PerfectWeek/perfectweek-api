import { TimeSlot } from "../core/TimeSlot";

export class TimeSlotView {
    public readonly formatTimeSlot = (timeSlot: TimeSlot): any => {
        return {
            start_time: timeSlot.startTime,
            end_time: timeSlot.endTime,
            score: timeSlot.score,
        };
    }
}
