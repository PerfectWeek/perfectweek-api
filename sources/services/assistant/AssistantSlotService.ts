import { Event } from "../../models/entities/Event";

import { EventType } from "../../core/enums/EventType";
import { TimeSlot } from "../../core/TimeSlot";
import { ITimeSlotPreferences } from "../../core/utils/TimeSlotPreferences";

import { Normalization } from "../../utils/maths/Normalization";

import { AssistantUtils } from "./AssistantUtils";

export class AssistantSlotService {

    private static readonly MINUTES = 60 * 1000;
    private static readonly TRAVEL_TIME = 30 * AssistantSlotService.MINUTES; // TODO: Use location for real

    /**
     * Find best slots to organize an Event
     *
     * @param slotOptions
     * @param alreadyAttendingEvents    All existing events to consider when looking for slots availability
     * @param timeSlotPreferences       The preferences matrices
     */
    public readonly findBestSlot = (
        slotOptions: SlotOptions,
        alreadyAttendingEvents: Event[],
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
        const preferencesMatrix = AssistantUtils.buildPreferencesMatrix(
            rawPreferencesMatrix,
            slotOptions.timezone,
        );

        // Test all slots between "afterDate" and "endDate"
        const slotDuration = slotOptions.duration * AssistantSlotService.MINUTES;
        let slotStartTime = new Date(slotOptions.afterDate);
        let slotEndTime = new Date(slotStartTime.getTime() + slotDuration);

        while (slotEndTime <= slotOptions.beforeDate) {
            // Test if slot is available (no Event conflicts)
            if (AssistantUtils.slotAvailableForAll(
                new Date(slotStartTime.getTime() - AssistantSlotService.TRAVEL_TIME),
                new Date(slotEndTime.getTime() + AssistantSlotService.TRAVEL_TIME),
                alreadyAttendingEvents,
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
    type: EventType,
    timezone: number,
};
