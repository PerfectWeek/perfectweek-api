import Event from "../models/entities/Event";

import EventVisibility from "../core/enums/EventVisibility";


class EventPolicy {

    public readonly eventIsPublic = (event: Event): boolean => {
        return event.visibility === EventVisibility.Public;
    };
}


export default EventPolicy;
