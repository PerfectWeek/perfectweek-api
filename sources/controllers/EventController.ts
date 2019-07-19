import { Request, Response } from "express";
import Boom from "@hapi/boom";
import { isUndefined } from "util";

import EventAttendeeRole from "../core/enums/EventAttendeeRole";
import EventAttendeeStatus, { eventAttendeeStatusFromString } from "../core/enums/EventAttendeeStatus";
import { eventVisibilityFromString } from "../core/enums/EventVisibility";

import EventView from "../views/EventView";

import CalendarPolicy from "../policies/CalendarPolicy";
import EventPolicy from "../policies/EventPolicy";

import Calendar from "../models/entities/Calendar";
import Event from "../models/entities/Event";

import CalendarRepository from "../models/CalendarRepository";
import EventRepository from "../models/EventRepository";

import DateService from "../services/DateService";

import { trim } from "../utils/string/trim";
import { getRequestingUser } from "../middleware/utils/getRequestingUser";

import { calendarMemberRoleToEventAttendeeRole } from "./utils/calendarMemberRoleToEventAttendeeRole";


class EventController {

    private readonly calendarRepository: CalendarRepository;
    private readonly eventRepository: EventRepository;

    private readonly calendarPolicy: CalendarPolicy;
    private readonly eventPolicy: EventPolicy;

    private readonly dateService: DateService;

    private readonly eventView: EventView;

    constructor(
        calendarRepository: CalendarRepository,
        eventRepository: EventRepository,
        calendarPolicy: CalendarPolicy,
        eventPolicy: EventPolicy,
        dateService: DateService,
        eventView: EventView
    ) {
        this.calendarRepository = calendarRepository;
        this.eventRepository = eventRepository;
        this.calendarPolicy = calendarPolicy;
        this.eventPolicy = eventPolicy;
        this.dateService = dateService;
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
        const eventColor = req.body.color;
        if (!eventName
            || !eventStart
            || !eventEnd
            || !eventType
            || !eventVisibility
            || !eventColor
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
            calendar = await this.calendarRepository.getCalendarWithMembers(calendarId);
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
                location: eventLocation,
                color: eventColor
            }),
            [{
                user: requestingUser,
                role: EventAttendeeRole.Admin,
                status: EventAttendeeStatus.Going
            }],
            calendar
                ? { calendar: calendar }
                : undefined
        );

        // Invite all Calendar members to the Event
        if (calendar) {
            // Select Calendar members to invite
            const calendarMembers = calendar.members!.filter(member => member.userId !== requestingUser.id);

            // Create and save invitations
            const attendees = calendarMembers.map(cm => ({
                user: cm.member!,
                role: calendarMemberRoleToEventAttendeeRole(cm.role),
                status: EventAttendeeStatus.Invited
            }));
            const eventAttendees = await this.eventRepository.addUsersToEvent(createdEvent, attendees);

            // Update Event object attendees list
            createdEvent.attendees = createdEvent.attendees!.concat(eventAttendees);
        }

        res.status(201).json({
            message: "Event created",
            event: this.eventView.formatEventWithAttendeesAndCalendars(createdEvent)
        });
    };

    public readonly getAllEvents = async (req: Request, res: Response) => {
        const requestingUser = getRequestingUser(req);

        // Retrieve query parameters
        const afterDateParam: string | undefined = req.query.after_date;
        const beforeDateParam: string | undefined = req.query.before_date;
        const onlyCalendarIdsParam: string[] | undefined = req.query.only_calendar_ids;
        const exceptCalendarIdsParam: string[] | undefined = req.query.except_calendar_ids;
        const onlyStatusesParam: string[] | undefined = req.query.only_statuses;

        // Validate parameters (afterDate)
        const afterDate = afterDateParam !== undefined
            ? new Date(afterDateParam)
            : undefined;
        if (afterDate && !this.dateService.isValidDate(afterDate)) {
            throw Boom.badRequest(`Invalid Date for query parameter "after_date"`);
        }

        // Validate parameters (beforeDate)
        const beforeDate = beforeDateParam !== undefined
            ? new Date(beforeDateParam)
            : undefined;
        if (beforeDate && !this.dateService.isValidDate(beforeDate)) {
            throw Boom.badRequest(`Invalid Date for query parameter "before_date"`);
        }

        // Validate parameters (onlyCalendarIds)
        const onlyCalendarIds = onlyCalendarIdsParam !== undefined
            ? onlyCalendarIdsParam.map(idString => parseInt(idString, 10))
            : undefined;
        if (onlyCalendarIds) {
            const invalidIdx = onlyCalendarIds.findIndex(isNaN);
            if (invalidIdx !== -1) {
                throw Boom.badRequest(`Invalid only_calendar_ids "${onlyCalendarIdsParam![invalidIdx]}"`);
            }
        }

        // Validate parameters (exceptCalendarIds)
        const exceptCalendarIds = exceptCalendarIdsParam !== undefined
            ? exceptCalendarIdsParam.map(idString => parseInt(idString, 10))
            : undefined;
        if (exceptCalendarIds) {
            const invalidIdx = exceptCalendarIds.findIndex(isNaN);
            if (invalidIdx !== -1) {
                throw Boom.badRequest(`Invalid except_calendar_ids "${exceptCalendarIdsParam![invalidIdx]}"`);
            }
        }

        // Validate parameters (onlyStatuses)
        const onlyStatuses = onlyStatusesParam !== undefined
            ? onlyStatusesParam.map(eventAttendeeStatusFromString)
            : undefined;
        if (onlyStatuses) {
            const invalidIdx = onlyStatuses.findIndex(isUndefined);
            if (invalidIdx !== -1) {
                throw Boom.badRequest(`Invalid only_statuses "${onlyStatusesParam![invalidIdx]}"`);
            }
        }

        // Prevent undefined behavior
        if (exceptCalendarIds !== undefined && onlyCalendarIds !== undefined) {
            throw Boom.badRequest("only_calendar_ids and except_calendar_ids cannot be used at the same time");
        }

        // Get corresponding events
        const eventStatuses = await this.eventRepository.getAllEventsForUserWithCalendars(
            requestingUser.id,
            {
                afterDate: afterDate,
                beforeDate: beforeDate,
                onlyCalendarIds: onlyCalendarIds,
                exceptCalendarIds: exceptCalendarIds,
                // We made sure that no statuses are undefined previously
                onlyStatuses: <EventAttendeeStatus[] | undefined>onlyStatuses
            }
        );

        res.status(200).json({
            message: "OK",
            events: eventStatuses.map(this.eventView.formatEventWithStatusAndCalendars)
        });
    };

    public readonly getEventInfo = async (req: Request, res: Response) => {
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

        res.status(200).json({
            message: "OK",
            event: this.eventView.formatEventWithAttendeesAndCalendars(event)
        });
    };
}


export default EventController;
