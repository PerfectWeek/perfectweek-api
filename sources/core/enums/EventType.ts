export enum EventType {
    Hobby = "hobby",
    Party = "party",
    Work = "work",
    Workout = "workout",
}

export function eventTypeFromString(eventType: string): EventType | undefined {
    switch (eventType) {
        case EventType.Hobby: return EventType.Hobby;
        case EventType.Party: return EventType.Party;
        case EventType.Work: return EventType.Work;
        case EventType.Workout: return EventType.Workout;
        default: return undefined;
    }
}
