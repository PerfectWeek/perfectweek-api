import { Event } from "../models/entities/Event";

export class EventSuggestion {
    public event: Event;
    public score: number;

    constructor(
        event: Event,
        score: number,
    ) {
        this.event = event;
        this.score = score;
    }
}
