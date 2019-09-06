import Boom from "@hapi/boom";
import { Request, Response } from "express";

import { CalendarRepository } from "../models/CalendarRepository";

import { ImageStorageService } from "../services/ImageStorageService";

import { CalendarPolicy } from "../policies/CalendarPolicy";

import { getRequestingUser } from "../middleware/utils/getRequestingUser";

export class CalendarImageController {
    private readonly calendarRepository: CalendarRepository;

    private readonly iconImageStorageService: ImageStorageService;

    private readonly calendarPolicy: CalendarPolicy;

    private readonly iconImageDefault: string;

    constructor(
        // Repositories
        calendarRepository: CalendarRepository,
        // Services,
        iconImageStorageService: ImageStorageService,
        // Policies
        calendarPolicy: CalendarPolicy,
        // Images
        iconImageDefault: string,
    ) {
        this.calendarRepository = calendarRepository;
        this.iconImageStorageService = iconImageStorageService;
        this.calendarPolicy = calendarPolicy;
        this.iconImageDefault = iconImageDefault;
    }

    public readonly uploadImage = async (req: Request, res: Response) => {
        const requestingUser = getRequestingUser(req);

        // Validate request's parameters
        const calendarId: number = parseInt(req.params.calendarId, 10);
        if (isNaN(calendarId)) {
            throw Boom.notFound(`Calendar id "${req.params.calendarId}" is invalid`);
        }

        // Make sure an image has been uploaded
        if (!req.file) {
            throw Boom.badRequest("Missing image argument");
        }

        // Make sure User can edit Calendar
        const calendarMembership = await this.calendarRepository.getCalendarMemberShip(calendarId, requestingUser.id);
        if (!calendarMembership
            || !this.calendarPolicy.userCanEditCalendarMetadata(calendarMembership)) {
            throw Boom.unauthorized("You cannot access this Calendar");
        }

        // Store Calendar image
        this.iconImageStorageService.storeImage(req.file.path, req.file.mimetype, calendarId);

        res.status(200).json({
            message: "Image saved",
        });
    }

    public readonly getImage = async (req: Request, res: Response) => {
        const requestingUser = getRequestingUser(req);

        // Validate request's parameters
        const calendarId: number = parseInt(req.params.calendarId, 10);
        if (isNaN(calendarId)) {
            throw Boom.notFound(`Calendar id "${req.params.calendarId}" is invalid`);
        }

        // Make sure User can access Calendar
        const calendarMembership = await this.calendarRepository.getCalendarMemberShip(calendarId, requestingUser.id);
        if (!calendarMembership
            || !this.calendarPolicy.userCanReadCalendar(calendarMembership)) {
            throw Boom.unauthorized("You cannot access this Calendar");
        }

        const imagePath = this.iconImageStorageService.getImageOrDefault(
            calendarMembership.calendarId,
            this.iconImageDefault,
        );

        res.status(200).sendFile(imagePath);
    }
}
