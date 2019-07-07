import { Request, Response } from "express";
import Boom from "@hapi/boom";

import EventAttendeeRole from "../core/enums/EventAttendeeRole";
import EventAttendeeStatus from "../core/enums/EventAttendeeStatus";
import { eventVisibilityFromString } from "../core/enums/EventVisibility";

import EventView from "../views/EventView";

import Event from "../models/entities/Event";

import EventRepository from "../models/EventRepository";

import { trim } from "../utils/string/trim";
import { getRequestingUser } from "../middleware/utils/getRequestingUser";


class EventController {

    private readonly eventRepository: EventRepository;

    private readonly eventView: EventView;

    constructor(
        eventRepository: EventRepository,
        eventView: EventView
    ) {
        this.eventRepository = eventRepository;
        this.eventView = eventView;
    }

    public readonly createEvent = async (req: Request, res: Response) => {
        const requestingUser = getRequestingUser(req);

        // Validate request's parameters
        const eventName = trim(req.body.name);
        const eventStart = req.body.start_time;
        const eventEnd = req.body.end_time;
        const eventType = req.body.type;
        const eventVisibility = req.body.visibility;
        const eventDescription = req.body.description;
        const eventLocation = req.body.location;
        if (!eventName || !eventStart || !eventEnd
            || !eventType || !eventVisibility) {
            throw Boom.badRequest("Missing fields for Event");
        }

        // Validate Event dates
        const startTime = new Date(eventStart);
        const endTime = new Date(eventEnd);
        if (startTime > endTime) {
            throw Boom.badRequest("Start date can't be after end date");
        }
        // Validate Event visibility
        const visibility = eventVisibilityFromString(eventVisibility);
        if (!visibility) {
            throw Boom.badRequest("Invalid visibility");
        }

        // Create and save new Event
        const createdEvent = await this.eventRepository.createEvent(
            new Event({
                name: eventName,
                startTime: startTime,
                endTime: endTime,
                type: eventType,
                visibility: eventVisibility,
                description: eventDescription,
                location: eventLocation
            }),
            [{
                user: requestingUser,
                role: EventAttendeeRole.Admin,
                status: EventAttendeeStatus.Going
            }]
        );

        res.status(201).json({
            message: "Event created",
            event: this.eventView.formatEventWithAttendees(createdEvent)
        });
    };
}


export default EventController;
