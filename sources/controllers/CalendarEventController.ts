import Boom from "@hapi/boom";
import { Request, Response } from "express";

import { CalendarRepository } from "../models/CalendarRepository";
import { EventRepository } from "../models/EventRepository";

import { CalendarPolicy } from "../policies/CalendarPolicy";
import { EventPolicy } from "../policies/EventPolicy";

import { getRequestingUser } from "../middleware/utils/getRequestingUser";

import { EventAttendeeRole } from "../core/enums/EventAttendeeRole";
import { EventAttendeeStatus } from "../core/enums/EventAttendeeStatus";

export class CalendarEventController {
    private readonly calendarRepository: CalendarRepository;
    private readonly eventRepository: EventRepository;

    private readonly calendarPolicy: CalendarPolicy;
    private readonly eventPolicy: EventPolicy;

    constructor(
        // Repositories
        calendarRepository: CalendarRepository,
        eventRepository: EventRepository,
        // Policies
        calendarPolicy: CalendarPolicy,
        eventPolicy: EventPolicy,
    ) {
        this.calendarRepository = calendarRepository;
        this.eventRepository = eventRepository;

        this.calendarPolicy = calendarPolicy;
        this.eventPolicy = eventPolicy;
    }

    public readonly addEventToCalendar = async (req: Request, res: Response) => {
        const requestingUser = getRequestingUser(req);

        // Validate request's parameters
        const calendarId: number = parseInt(req.params.calendarId, 10);
        if (isNaN(calendarId)) {
            throw Boom.notFound(`Calendar id "${req.params.calendarId}" is invalid`);
        }
        const eventId: number = parseInt(req.body.event_id, 10);
        if (isNaN(eventId)) {
            throw Boom.badRequest("Missing valid event_id");
        }

        // Make sure User can add Event to this Calendar
        const calendarMembership = await this.calendarRepository.getCalendarMemberShip(calendarId, requestingUser.id);
        if (!calendarMembership
            || !this.calendarPolicy.userCanAddEventToCalendar(calendarMembership)) {
            throw Boom.unauthorized("You cannot add Event to this Calendar");
        }

        // Retrieve Calendar with members
        const calendar = await this.calendarRepository.getCalendarWithMembers(calendarId);
        if (!calendar) {
            throw Boom.notFound("Calendar not found");
        }

        // Make sure Event can be added to Calendars
        const event = await this.eventRepository.getEventWithAttendees(eventId);
        if (!event
            || !this.eventPolicy.eventIsPublic(event)) {
            throw Boom.unauthorized("You cannot add this Event to Calendars");
        }

        // Make sure Event is not already in Calendar
        const alreadyExistingCalendarEntry = await this.calendarRepository.getCalendarEntry(calendarId, event.id);
        if (alreadyExistingCalendarEntry) {
            throw Boom.conflict("This Event is already in this Calendar");
        }

        // Add Event to Calendar
        await this.calendarRepository.addEventToCalendar(calendar, event);

        // Create new attendees
        const existingAttendees = new Set<number>(event.attendees!.map(e => e.userId));
        const newAttendees = calendar.members!
            .filter(m => !existingAttendees.has(m.member!.id))
            .map(m => ({
                user: m.member!,
                role: EventAttendeeRole.Spectator,
                status: EventAttendeeStatus.None,
            }));
        await this.eventRepository.addUsersToEvent(event, newAttendees);

        res.status(200).json({
            message: "Event added to Calendar",
        });
    }

    public readonly removeEventFromCalendar = async (req: Request, res: Response) => {
        const requestingUser = getRequestingUser(req);

        // Validate request's parameters
        const calendarId: number = parseInt(req.params.calendarId, 10);
        if (isNaN(calendarId)) {
            throw Boom.notFound(`Calendar id "${req.params.calendarId}" is invalid`);
        }
        const eventId: number = parseInt(req.params.eventId, 10);
        if (isNaN(eventId)) {
            throw Boom.notFound(`Event id "${req.params.eventId}" is invalid`);
        }

        // Make sure User can remove Event from this Calendar
        const calendarMembership = await this.calendarRepository.getCalendarMemberShip(calendarId, requestingUser.id);
        if (!calendarMembership
            || !this.calendarPolicy.userCanRemoveEventFromCalendar(calendarMembership)) {
            throw Boom.unauthorized("You cannot remove Events from this Calendar");
        }

        // Check if Event is in this Calendar
        const calendarEntry = await this.calendarRepository.getCalendarEntry(calendarId, eventId);
        if (!calendarEntry) {
            throw Boom.notFound("This Event is not part of this Calendar");
        }

        // Remove Event from Calendar
        await this.calendarRepository.removeEventFromCalendar(calendarEntry.calendarId, calendarEntry.eventId);

        res.status(200).json({
            message: "Event removed from Calendar",
        });
    }
}
