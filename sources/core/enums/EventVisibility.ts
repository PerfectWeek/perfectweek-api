export enum EventVisibility {
    Public = "public",
    Private = "private",
}

export function eventVisibilityFromString(visibility: string): EventVisibility | undefined {
    switch (visibility) {
        case EventVisibility.Private: return EventVisibility.Private;
        case EventVisibility.Public: return EventVisibility.Public;
        default: return undefined;
    }
}
