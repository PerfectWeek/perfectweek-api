import { Request, Response } from "express";
import Boom from "@hapi/boom";

import Calendar from "../models/entities/Calendar";
import CalendarMemberRole from "../core/enums/CalendarMemberRole";

import CalendarRepository from "../models/CalendarRepository";

import CalendarView from "../views/CalendarView";

import { trim } from "../utils/string/trim";
import { getRequestingUser } from "../middleware/utils/getRequestingUser";


class CalendarController {

    private readonly calendarRepository: CalendarRepository;

    private readonly calendarView: CalendarView;

    constructor(
        // Repositories
        calendarRepository: CalendarRepository,

        // Views
        calendarView: CalendarView
    ) {
        this.calendarRepository = calendarRepository;
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

    public readonly getAllCalendarsOfRequestingUser = async (req: Request, res: Response) => {
        const requestingUser = getRequestingUser(req);

        const calendarMembers = await this.calendarRepository.getAllCalendarsForUserId(requestingUser.id);

        res.status(200).json({
            message: "OK",
            calendars: calendarMembers.map(this.calendarView.formatCalendarRecapWithMembership)
        });
    };
}


export default CalendarController;
