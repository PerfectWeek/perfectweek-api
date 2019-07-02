import { Request, Response } from "express";

import CalendarRepository from "../models/CalendarRepository";

import CalendarView from "../views/CalendarView";

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
