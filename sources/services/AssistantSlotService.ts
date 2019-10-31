import { Event } from "../models/entities/Event";

import { TimeSlot } from "../core/TimeSlot";
import { ITimeSlotPreferences } from "../core/utils/TimeSlotPreferences";

import { Normalization } from "../utils/maths/Normalization";

export class AssistantSlotService {

    private static readonly MINUTES = 60 * 1000;
    private static readonly TRAVEL_TIME = 30 * AssistantSlotService.MINUTES; // TODO: Use location for real

    /**
     * Find best slots to organize and Event
     *
     * @param slotOptions
     * @param events    All existing events to consider when looking for slots availability
     * @param timeSlotPreferences   The preferences matrices
     */
    public readonly findBestSlot = (
        slotOptions: SlotOptions,
        events: Event[],
        timeSlotPreferences: ITimeSlotPreferences,
    ): TimeSlot[] => {
        const slots = [];
        const stride = 60 * AssistantSlotService.MINUTES; // 1 hour stride
        let scoreMin = 0;
        let scoreMax = 0;

        // Retrieve preferences matrix and apply timezone
        const rawPreferencesMatrix = timeSlotPreferences[slotOptions.type];
        if (!rawPreferencesMatrix) {
            throw new Error(`Unknown Event type ${slotOptions.type}`);
        }
        const preferencesMatrix = AssistantSlotService.buildPreferencesMatrix(
            rawPreferencesMatrix,
            slotOptions.timezone,
        );

        // Test all slots between "afterDate" and "endDate"
        const slotDuration = slotOptions.duration * AssistantSlotService.MINUTES;
        let slotStartTime = new Date(slotOptions.afterDate);
        let slotEndTime = new Date(slotStartTime.getTime() + slotDuration);

        while (slotEndTime <= slotOptions.beforeDate) {
            // Test if slot is available (no Event conflicts)
            if (AssistantSlotService.slotAvailableForAll(
                events,
                new Date(slotStartTime.getTime() - AssistantSlotService.TRAVEL_TIME),
                new Date(slotEndTime.getTime() + AssistantSlotService.TRAVEL_TIME),
            )) {
                // Compute the score of the available slot
                const score = AssistantSlotService.computeSlotScore(
                    slotStartTime,
                    slotEndTime,
                    preferencesMatrix,
                );
                scoreMin = Math.min(score, scoreMin);
                scoreMax = Math.max(score, scoreMax);

                // Save the slot
                slots.push(new TimeSlot(
                    slotStartTime,
                    slotEndTime,
                    score,
                ));
            }

            // Test with next time (one stride later)
            slotStartTime = new Date(slotStartTime.getTime() + stride);
            slotEndTime = new Date(slotStartTime.getTime() + slotDuration);
        }

        // Normalize scores and order by relevance (highest first)
        return AssistantSlotService
            .normalizeSlotsScores(slots, scoreMin, scoreMax)
            .sort((s1, s2) => s2.score - s1.score);
    }

    //
    // Slot collisions detector
    //
    private static readonly slotAvailableForAll = (
        events: Event[],
        slotStartTime: Date,
        slotEndTime: Date,
    ): boolean => {
        return events.every(event => {
            return slotStartTime > event.endTime
                || slotEndTime < event.startTime;
        });
    }

    //
    // Slot score
    //
    private static readonly computeSlotScore = (
        slotStartTime: Date,
        slotEndTime: Date,
        preferencesMatrix: number[][],
    ): number => {
        const ONE_HOUR = 60 * AssistantSlotService.MINUTES;
        let score = 0;

        // Sums the scores associated to every hours of the slot
        let timeIterator = new Date(slotStartTime);
        while (timeIterator < slotEndTime) {
            score += preferencesMatrix[timeIterator.getUTCDay()][timeIterator.getUTCHours()];
            timeIterator = new Date(timeIterator.getTime() + ONE_HOUR);
        }

        return score;
    }

    private static readonly normalizeSlotsScores = (
        slots: TimeSlot[],
        scoreMin: number,
        scoreMax: number,
    ): TimeSlot[] => {
        return slots.map(slot => ({
            ...slot,
            score: Normalization.minMax(slot.score, scoreMin, scoreMax),
        }));
    }

    //
    // Preferences Matrix processing
    //
    private static readonly buildPreferencesMatrix = (
        preferences: number[][],
        timezone: number,
    ): number[][] => {
        preferences = AssistantSlotService.applyTimezone(preferences, timezone);

        const data = Normalization.softmax(Array<number>(0).concat(...preferences));
        const ret: number[][] = [data.splice(0, 24)];

        while (data.length) {
            ret.push(data.splice(0, 24));
        }

        return ret;
    }

    private static readonly applyTimezone = (
        preferences: number[][],
        timezone: number,
    ): number[][] => {
        const timezoneOffset = Math.round(timezone / 60);
        if (timezoneOffset === 0) {
            return preferences;
        }

        // Create new preferences matrix
        const localizedPreferences = new Array(7)
            .fill([]).map(() => new Array(24).fill(0));

        // Fill new preferences matrix
        preferences.forEach((prefsDay: number[], dayIdx: number) => {
            prefsDay.forEach((prefsHour: number, hourIdx: number) => {
                let localHourIdx = hourIdx - timezoneOffset; // Back to UTC
                let localDayIdx = dayIdx;

                if (localHourIdx > 23) {
                    localHourIdx %= 24;
                    localDayIdx += 1;
                }
                else if (localHourIdx < 0) {
                    localHourIdx += 24;
                    localDayIdx -= 1;
                }
                if (localDayIdx < 0) {
                    localDayIdx += 7;
                }
                else if (localDayIdx > 6) {
                    localDayIdx -= 7;
                }

                localizedPreferences[localDayIdx][localHourIdx] = prefsHour;
            });
        });

        return localizedPreferences;
    }
}

/**
 * @member afterDate - Find slots after this Date
 * @member beforeDate - Find slots before this Date
 * @member duration - Event duration (in minutes)
 * @member type - The type of Event to use in `preferences matrix`
 * @member timezone - The timezone to consider
 */
type SlotOptions = {
    afterDate: Date,
    beforeDate: Date,
    duration: number,
    type: string,
    timezone: number,
};
