import Boom from "@hapi/boom";
import { Request, Response } from "express";

import { EventRepository } from "../models/EventRepository";

import { ImageStorageService } from "../services/ImageStorageService";

import { EventPolicy } from "../policies/EventPolicy";

import { getRequestingUser } from "../middleware/utils/getRequestingUser";

export class EventImageController {

    private readonly eventRepository: EventRepository;

    private readonly imageStorageService: ImageStorageService;

    private readonly eventPolicy: EventPolicy;

    private readonly imageDefault: string;

    constructor(
        // Repositories
        eventRepository: EventRepository,
        // Services
        imageStorageService: ImageStorageService,
        // Policies
        eventPolicy: EventPolicy,
        // Images
        imageDefault: string,
    ) {
        this.eventRepository = eventRepository;
        this.imageStorageService = imageStorageService;
        this.eventPolicy = eventPolicy;
        this.imageDefault = imageDefault;
    }

    public readonly uploadImage = async (req: Request, res: Response) => {
        const requestingUser = getRequestingUser(req);

        // Validate request's parameters
        const eventId: number = parseInt(req.params.eventId, 10);
        if (isNaN(eventId)) {
            throw Boom.notFound(`Event id "${req.params.eventId}" is invalid`);
        }

        // Make sure an image has been uploaded
        if (!req.file) {
            throw Boom.badRequest("Missing image argument");
        }

        // Retrieve Event
        const eventStatus = await this.eventRepository.getEventRelationship(eventId, requestingUser.id);
        if (!eventStatus
            || !this.eventPolicy.userCanEditEvent(eventStatus)) {
            throw Boom.notFound("You cannot access this Event");
        }

        // Store Event image
        this.imageStorageService.storeImage(req.file.path, req.file.mimetype, eventId);

        res.status(200).json({
            message: "Image uploaded",
        });
    }

    public readonly getImage = async (req: Request, res: Response) => {
        const requestingUser = getRequestingUser(req);

        // Validate request's parameters
        const eventId: number = parseInt(req.params.eventId, 10);
        if (isNaN(eventId)) {
            throw Boom.notFound(`Event id "${req.params.eventId}" is invalid`);
        }

        // Retrieve Event
        const event = await this.eventRepository.getEventWithAttendeesAndCalendarsForUser(eventId, requestingUser.id);
        if (!event) {
            throw Boom.notFound("Event not found");
        }

        // Retrieve attendee status
        const eventStatus = await this.eventRepository.getEventRelationship(event.id, requestingUser.id);

        // Make sure the User can access this Event
        if (!this.eventPolicy.eventIsPublic(event)
            && (!eventStatus || !this.eventPolicy.userCanReadEvent(eventStatus))) {
            throw Boom.unauthorized("You cannot access this Event");
        }

        // Retrieve image
        const imagePath = this.imageStorageService.getImageOrDefault(
            event.id,
            this.imageDefault,
        );

        res.status(200).sendFile(imagePath);
    }
}
