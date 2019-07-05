import { Request, Response } from "express";
import Boom from "@hapi/boom";

import Calendar from "../models/entities/Calendar";
import CalendarMemberRole from "../core/enums/CalendarMemberRole";

import CalendarRepository from "../models/CalendarRepository";

import CalendarPolicy from "../policies/CalendarPolicy";

import CalendarView from "../views/CalendarView";

import { trim } from "../utils/string/trim";
import { getRequestingUser } from "../middleware/utils/getRequestingUser";


class CalendarController {

    private readonly calendarRepository: CalendarRepository;

    private readonly calendarPolicy: CalendarPolicy;

    private readonly calendarView: CalendarView;

    constructor(
        // Repositories
        calendarRepository: CalendarRepository,

        // Policies
        calendarPolicy: CalendarPolicy,

        // Views
        calendarView: CalendarView
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
                color: calendarColor
            }),
            [{
                user: requestingUser,
                role: CalendarMemberRole.Admin,
                invitationConfirmed: true
            }]
        );

        res.status(201).json({
            message: "Calendar created",
            calendar: this.calendarView.formatCalendarWithMembers(calendar)
        });
    };

    public readonly getCalendarInfo = async (req: Request, res: Response) => {
        const requestingUser = getRequestingUser(req);

        // Validate request's parameters
        const calendarId: number = parseInt(req.params.calendarId);
        if (!calendarId) {
            throw Boom.notFound(`Calendar id "${req.params.calendarId}" is invalid`);
        }

        // Make sure User can access Calendar
        const calendarMembership = await this.calendarRepository.getCalendarMemberShip(calendarId, requestingUser.id);
        if (!calendarMembership
            || !this.calendarPolicy.userCanReadCalendar(calendarMembership)) {
            throw Boom.unauthorized("You cannot access this Calendar");
        }

        // Retrieve Calendar
        const calendar = await this.calendarRepository.getCalendar(calendarId);
        if (!calendar) {
            throw Boom.notFound("Calendar does not exists");
        }

        res.status(200).json({
            message: "OK",
            calendar: this.calendarView.formatCalendarWithMembership(calendar, calendarMembership)
        });
    };

    public readonly editCalendarInfo = async (req: Request, res: Response) => {
        const requestingUser = getRequestingUser(req);

        // Validate request's parameters
        const calendarId: number = parseInt(req.params.calendarId);
        const calendarNewName = trim(req.body.name);
        const calendarNewColor = trim(req.body.color);
        if (!calendarId) {
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
        calendar.color = calendarNewColor;
        calendar.name = calendarNewName;
        const updatedCalendar = await this.calendarRepository.updateCalendar(calendar);

        res.status(200).json({
            message: "OK",
            calendar: this.calendarView.formatCalendarWithMembership(updatedCalendar, calendarMembership)
        });
    };

    public readonly getCalendarMembers = async (req: Request, res: Response) => {
        const requestingUser = getRequestingUser(req);

        // Validate request's parameters
        const calendarId: number = parseInt(req.params.calendarId);
        if (!calendarId) {
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
        if (!calendar.members) {
            throw new Error("Calendar.members is not set");
        }

        res.status(200).json({
            message: "OK",
            members: calendar.members.map(this.calendarView.formatCalendarMember)
        });
    };

    public readonly getAllCalendarsOfRequestingUser = async (req: Request, res: Response) => {
        const requestingUser = getRequestingUser(req);

        const calendarMembers = await this.calendarRepository.getAllCalendarsForUserId(requestingUser.id);

        res.status(200).json({
            message: "OK",
            calendars: calendarMembers.map(this.calendarView.formatCalendarFromMembership)
        });
    };
}


export default CalendarController;
