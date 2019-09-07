import Boom from "@hapi/boom";
import { Request, Response } from "express";

import { CalendarMemberRole } from "../core/enums/CalendarMemberRole";

import { Calendar } from "../models/entities/Calendar";

import { CalendarRepository } from "../models/CalendarRepository";

import { CalendarPolicy } from "../policies/CalendarPolicy";

import { CalendarView } from "../views/CalendarView";

import { getRequestingUser } from "../middleware/utils/getRequestingUser";
import { trim } from "../utils/string/trim";

import { CalendarInvitationStatus, calendarInvitationStatusFromString } from "./enums/CalendarInvitationStatus";

export class CalendarController {

    private readonly calendarRepository: CalendarRepository;

    private readonly calendarPolicy: CalendarPolicy;

    private readonly calendarView: CalendarView;

    constructor(
        // Repositories
        calendarRepository: CalendarRepository,
        // Policies
        calendarPolicy: CalendarPolicy,
        // Views
        calendarView: CalendarView,
    ) {
        this.calendarRepository = calendarRepository;
        this.calendarPolicy = calendarPolicy;
        this.calendarView = calendarView;
    }

    public readonly createCalendar = async (req: Request, res: Response) => {
        const requestingUser = getRequestingUser(req);

        const calendarName = trim(req.body.name);
        const calendarColor = trim(req.body.color);

        // Validate request's parameters
        if (!calendarName || !calendarColor) {
            throw Boom.badRequest("Missing fields for Calendar");
        }

        // Create and save new Calendar
        const calendar = await this.calendarRepository.createCalendar(
            new Calendar({
                name: calendarName,
                color: calendarColor,
            }),
            [{
                user: requestingUser,
                role: CalendarMemberRole.Admin,
                invitationConfirmed: true,
            }],
        );

        // Make sure the requesting User has been added to the Calendar
        const calendarMembership = await this.calendarRepository.getCalendarMemberShip(calendar.id, requestingUser.id);
        if (!calendarMembership) {
            throw new Error("The requesting User should be a member of the calendar");
        }

        res.status(201).json({
            message: "Calendar created",
            calendar: this.calendarView.formatCalendarWithMembershipAndMembers(calendar, calendarMembership),
        });
    }

    public readonly getCalendar = async (req: Request, res: Response) => {
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

        // Retrieve Calendar
        const calendar = await this.calendarRepository.getCalendarWithMembers(calendarId);
        if (!calendar) {
            throw Boom.notFound("Calendar does not exists");
        }

        res.status(200).json({
            message: "OK",
            calendar: this.calendarView.formatCalendarWithMembershipAndMembers(calendar, calendarMembership),
        });
    }

    public readonly getAllCalendars = async (req: Request, res: Response) => {
        const requestingUser = getRequestingUser(req);

        // Validate request's parameters
        const invitationStatusQuery: string | undefined = req.query.invitation_status;

        const options: { invitationConfirmed?: boolean } = {};
        // Process query option: "invitation_status"
        if (invitationStatusQuery !== undefined) {
            const invitationStatus = calendarInvitationStatusFromString(invitationStatusQuery);
            if (invitationStatus === undefined) {
                throw Boom.badRequest(`Invalid invitation_status: "${invitationStatusQuery}"`);
            }
            options.invitationConfirmed = invitationStatus === CalendarInvitationStatus.Confirmed;
        }

        // Retrieve Calendars
        const calendarMembers = await this.calendarRepository.getAllCalendarsForUserId(requestingUser.id, options);

        res.status(200).json({
            message: "OK",
            calendars: calendarMembers.map(this.calendarView.formatCalendarFromMembership),
        });
    }

    public readonly editCalendar = async (req: Request, res: Response) => {
        const requestingUser = getRequestingUser(req);

        // Validate request's parameters
        const calendarId = parseInt(req.params.calendarId, 10);
        const calendarNewName = trim(req.body.name);
        const calendarNewColor = trim(req.body.color);
        if (isNaN(calendarId)) {
            throw Boom.notFound(`Calendar id "${req.params.calendarId}" is invalid`);
        }
        if (!calendarNewName || !calendarNewColor) {
            throw Boom.badRequest("Missing fields for Calendar");
        }

        // Make sure User can edit Calendar
        const calendarMembership = await this.calendarRepository.getCalendarMemberShip(calendarId, requestingUser.id);
        if (!calendarMembership
            || !this.calendarPolicy.userCanEditCalendarMetadata(calendarMembership)) {
            throw Boom.unauthorized("You cannot access this Calendar");
        }

        // Retrieve Calendar
        const calendar = await this.calendarRepository.getCalendar(calendarId);
        if (!calendar) {
            throw Boom.notFound("Calendar does not exists");
        }

        // Edit Calendar
        calendar.name = calendarNewName;
        calendar.color = calendarNewColor;
        const updatedCalendar = await this.calendarRepository.updateCalendar(calendar);

        res.status(200).json({
            message: "OK",
            calendar: this.calendarView.formatCalendarWithMembership(updatedCalendar, calendarMembership),
        });
    }

    public readonly deleteCalendar = async (req: Request, res: Response) => {
        const requestingUser = getRequestingUser(req);

        // Validate request's parameters
        const calendarId: number = parseInt(req.params.calendarId, 10);
        if (isNaN(calendarId)) {
            throw Boom.notFound(`Calendar id "${req.params.calendarId}" is invalid`);
        }

        // Make sure User can access Calendar
        const calendarMembership = await this.calendarRepository.getCalendarMemberShip(calendarId, requestingUser.id);
        if (!calendarMembership
            || !this.calendarPolicy.userCanDeleteCalendar(calendarMembership)) {
            throw Boom.unauthorized("You cannot access this Calendar");
        }

        // Retrieve Calendar
        const calendar = await this.calendarRepository.getCalendar(calendarId);
        if (!calendar) {
            throw Boom.notFound("Calendar does not exists");
        }

        // Delete Calendar
        await this.calendarRepository.deleteCalendar(calendar.id);

        res.status(200).json({
            message: "Calendar deleted",
        });
    }
}
