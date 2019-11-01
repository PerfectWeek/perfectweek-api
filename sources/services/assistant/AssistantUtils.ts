import { Event } from "../../models/entities/Event";

import { Normalization } from "../../utils/maths/Normalization";

export class AssistantUtils {

    /**
     * Normalize and apply timezone to the preferences Matrix
     */
    public static readonly buildPreferencesMatrix = (
        preferences: number[][],
        timezone: number,
    ): number[][] => {
        preferences = AssistantUtils.localizePreferenceMatrix(preferences, timezone);

        const data = Normalization.softmax(Array<number>(0).concat(...preferences));
        const ret: number[][] = [data.splice(0, 24)];

        while (data.length) {
            ret.push(data.splice(0, 24));
        }

        return ret;
    }

    /**
     * Detect slots overriding
     */
    public static readonly slotAvailableForAll = (
        slotStartTime: Date,
        slotEndTime: Date,
        events: Event[],
    ): boolean => {
        return events.every(event => {
            return slotStartTime > event.endTime
                || slotEndTime < event.startTime;
        });
    }

    private static readonly localizePreferenceMatrix = (
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
