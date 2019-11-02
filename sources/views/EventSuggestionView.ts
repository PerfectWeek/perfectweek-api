import { EventSuggestion } from "../core/EventSuggestion";

import { EventView } from "./EventView";

export class EventSuggestionView {

    private readonly eventView: EventView;

    constructor(eventView: EventView) {
        this.eventView = eventView;
    }

    public readonly formatSuggestion = (eventSuggestion: EventSuggestion): any => {
        return {
            event: this.eventView.formatEvent(eventSuggestion.event),
            score: eventSuggestion.score.toFixed(3),
        };
    }
}
