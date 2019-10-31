import Boom from "@hapi/boom";
import { Request, Response } from "express";

import { CalendarRepository } from "../models/CalendarRepository";
import { EventRepository } from "../models/EventRepository";

import { AssistantSlotService } from "../services/AssistantSlotService";
import { DateService } from "../services/DateService";

import { TimeSlotView } from "../views/TimeSlotView";

import { EventAttendeeStatus } from "../core/enums/EventAttendeeStatus";

import { getRequestingUser } from "../middleware/utils/getRequestingUser";

export class AssistantController {

    private static readonly DEFAULT_SLOT_LIMIT = "10";

    private readonly calendarRepository: CalendarRepository;
    private readonly eventRepository: EventRepository;

    private readonly assistantSlotService: AssistantSlotService;
    private readonly dateService: DateService;

    private readonly timeSlotView: TimeSlotView;

    constructor(
        // Repositories
        calendarRepository: CalendarRepository,
        eventRepository: EventRepository,
        // Services
        assistantSlotService: AssistantSlotService,
        dateService: DateService,
        // Views
        timeSlotView: TimeSlotView,
    ) {
        this.calendarRepository = calendarRepository;
        this.eventRepository = eventRepository;
        this.assistantSlotService = assistantSlotService;
        this.dateService = dateService;
        this.timeSlotView = timeSlotView;
    }

    public readonly findBestSlots = async (req: Request, res: Response) => {
        const requestingUser = getRequestingUser(req);

        // Validate request's parameters
        const calendarId = Number.parseInt(req.params.calendarId, 10);
        if (isNaN(calendarId)) {
            throw Boom.badRequest(`Invalid Calendar id "${req.params.calendarId}"`);
        }
        const slotDuration = Number.parseInt(req.query.duration, 10);
        if (!slotDuration) {
            throw Boom.badRequest(`Invalid slot duration "${req.query.duration}"`);
        }
        const slotMinDate = new Date(req.query.min_time);
        if (!this.dateService.isValidDate(slotMinDate)) {
            throw Boom.badRequest(`Invalid min_time "${req.query.min_time}"`);
        }
        const slotMaxDate = new Date(req.query.max_time);
        if (!this.dateService.isValidDate(slotMaxDate)) {
            throw Boom.badRequest(`Invalid max_time "${req.query.max_time}"`);
        }
        const eventType: string | undefined = req.query.type;
        if (!eventType) {
            throw Boom.badRequest('Missing "type"');
        }
        const nbSlots = Number.parseInt(req.query.limit || AssistantController.DEFAULT_SLOT_LIMIT, 10);
        if (isNaN(nbSlots) || nbSlots <= 0) {
            throw Boom.badRequest(`Invalid limit "${req.query.limit}"`);
        }

        // Get calendar
        const calendar = await this.calendarRepository.getCalendarWithMembers(calendarId);
        if (!calendar) {
            throw Boom.notFound("Calendar does not exist");
        }
        if (!calendar.members) {
            throw new Error("Calendar should include members");
        }

        // Make sure requestingUser is a member of the Calendar
        if (calendar.members.findIndex(m => m.userId === requestingUser.id) < 0) {
            throw Boom.forbidden("You do not have access to this Calendar");
        }

        // Get all Event's related to the Calendar members in date range
        const eventsPromises = Promise.all(calendar.members.map(m => this.eventRepository.getAllEventsForUser(
            m.userId,
            {
                afterDate: slotMinDate,
                beforeDate: slotMaxDate,
                onlyStatuses: [
                    EventAttendeeStatus.Going,
                    EventAttendeeStatus.Maybe,
                ],
            },
            false,
        )));
        const eventsByUser = await eventsPromises;
        const seenEventIds = new Set<number>(); // used to filter duplicates
        const events = eventsByUser
            .reduce((agg, list) => agg.concat(list), [])
            .filter(ea => {
                if (seenEventIds.has(ea.eventId)) {
                    return false;
                }
                seenEventIds.add(ea.eventId);
                return true;
            })
            .map(ea => {
                if (!ea.event) {
                    throw new Error("EventAttendee.event should be defined");
                }
                return ea.event;
            });

        // Find best slots
        const slots = this.assistantSlotService
            .findBestSlot(
                {
                    afterDate: slotMinDate,
                    beforeDate: slotMaxDate,
                    duration: slotDuration,
                    type: eventType,
                    timezone: requestingUser.timezone,
                },
                events,
                calendar.timeSlotPreferences,
            )
            .splice(0, nbSlots);

        res.status(200).json({
            message: "OK",
            slots: slots.map(this.timeSlotView.formatTimeSlot),
        });
    }

    public readonly eventSuggestion = async (_req: Request, res: Response) => {
        // TODO
        res.status(200).json({
            message: "OK",
        });
    }

    public readonly perfectWeek = async (_req: Request, res: Response) => {
        // TODO
        res.status(200).json({
            message: "OK",
        });
    }
}
