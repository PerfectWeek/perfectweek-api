import { Request, Response } from "express";
import Boom from "@hapi/boom";

import EventAttendeeRole from "../core/enums/EventAttendeeRole";
import EventAttendeeStatus from "../core/enums/EventAttendeeStatus";
import { eventVisibilityFromString } from "../core/enums/EventVisibility";

import EventView from "../views/EventView";

import CalendarPolicy from "../policies/CalendarPolicy";

import Calendar from "../models/entities/Calendar";
import Event from "../models/entities/Event";

import CalendarRepository from "../models/CalendarRepository";
import EventRepository from "../models/EventRepository";

import { trim } from "../utils/string/trim";
import { getRequestingUser } from "../middleware/utils/getRequestingUser";


class EventController {

    private readonly calendarRepository: CalendarRepository;
    private readonly eventRepository: EventRepository;

    private readonly calendarPolicy: CalendarPolicy;

    private readonly eventView: EventView;

    constructor(
        calendarRepository: CalendarRepository,
        eventRepository: EventRepository,
        calendarPolicy: CalendarPolicy,
        eventView: EventView
    ) {
        this.calendarRepository = calendarRepository;
        this.eventRepository = eventRepository;
        this.calendarPolicy = calendarPolicy;
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
        if (!eventName
            || !eventStart
            || !eventEnd
            || !eventType
            || !eventVisibility
        ) {
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

        // Validate optionnal parameter "calendar_id"
        const calendarId = req.body.calendar_id !== undefined ? parseInt(req.body.calendar_id, 10) : undefined;
        if (calendarId !== undefined && isNaN(calendarId)) {
            throw Boom.badRequest("Invalid calendar_id");
        }

        // If a Calendar has been specified, make sure the User can access it
        let calendar: Calendar | undefined = undefined;
        if (calendarId) {
            // Ensure the User is a member of the Calendar and has enough rights
            const calendarMembership = await this.calendarRepository.getCalendarMemberShip(
                calendarId,
                requestingUser.id
            );
            if (!calendarMembership
                || !this.calendarPolicy.userCanAddEventToCalendar(calendarMembership)) {
                throw Boom.unauthorized("You do not have access to this Calendar");
            }

            // Retrieve the corresponding Calendar
            calendar = await this.calendarRepository.getCalendar(calendarId);
            if (!calendar) {
                throw Boom.notFound("Calendar not found");
            }
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
            }],
            calendar
                ? { calendar: calendar, color: calendar.color }
                : undefined
        );

        res.status(201).json({
            message: "Event created",
            event: this.eventView.formatEventWithAttendeesAndCalendars(createdEvent)
        });
    };
}


export default EventController;
