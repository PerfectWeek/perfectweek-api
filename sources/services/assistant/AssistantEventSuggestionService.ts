import { Event } from "../../models/entities/Event";

import { EventSuggestion } from "../../core/EventSuggestion";

import { AssistantUtils } from "./AssistantUtils";

export class AssistantEventSuggestionService {

    /**
     * Recommend Events matching preferences and that are not conflicting with existing ones
     */
    public readonly eventSuggestions = (
        recommendableEvents: Event[],
        alreadyAttendingEvents: Event[],
    ): EventSuggestion[] => {
        return recommendableEvents
            .filter(re => AssistantUtils.slotAvailableForAll(re.startTime, re.endTime, alreadyAttendingEvents))
            .map(re => ({
                event: re,
                score: this.computeRecommendationScore(re),
            }))
            .sort((es1, es2) => es2.score - es1.score);
    }

    private readonly computeRecommendationScore = (_event: Event) => {
        return 1; // TODO: Build a real recommendation system (maybe collaborative filtering)
    }
}
