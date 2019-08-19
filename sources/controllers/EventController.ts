import Boom from "@hapi/boom";
import { Request, Response } from "express";
import { isUndefined } from "util";

import { EventAttendeeRole } from "../core/enums/EventAttendeeRole";
import { EventAttendeeStatus, eventAttendeeStatusFromString } from "../core/enums/EventAttendeeStatus";
import { eventVisibilityFromString } from "../core/enums/EventVisibility";

import { EventView } from "../views/EventView";

import { CalendarPolicy } from "../policies/CalendarPolicy";
import { EventPolicy } from "../policies/EventPolicy";

import { Calendar } from "../models/entities/Calendar";
import { Event } from "../models/entities/Event";

import { CalendarRepository } from "../models/CalendarRepository";
import { EventRepository } from "../models/EventRepository";

import { DateService } from "../services/DateService";
import { ImageStorageService } from "../services/ImageStorageService";

import { getRequestingUser } from "../middleware/utils/getRequestingUser";
import { trim } from "../utils/string/trim";

import { calendarMemberRoleToEventAttendeeRole } from "./utils/calendarMemberRoleToEventAttendeeRole";

export class EventController {

    private readonly calendarRepository: CalendarRepository;
    private readonly eventRepository: EventRepository;

    private readonly calendarPolicy: CalendarPolicy;
    private readonly eventPolicy: EventPolicy;

    private readonly dateService: DateService;
    private readonly eventImageStorageService: ImageStorageService;

    private readonly eventView: EventView;

    private readonly eventImageDefault: string;

    constructor(
        // Repositories
        calendarRepository: CalendarRepository,
        eventRepository: EventRepository,
        // Policies
        calendarPolicy: CalendarPolicy,
        eventPolicy: EventPolicy,
        // Services
        dateService: DateService,
        eventImageStorageService: ImageStorageService,
        // Views
        eventView: EventView,
        // Images
        eventImageDefault: string,
    ) {
        this.calendarRepository = calendarRepository;
        this.eventRepository = eventRepository;

        this.calendarPolicy = calendarPolicy;
        this.eventPolicy = eventPolicy;

        this.dateService = dateService;
        this.eventImageStorageService = eventImageStorageService;

        this.eventView = eventView;

        this.eventImageDefault = eventImageDefault;
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
        let calendar: Calendar | undefined;
        if (calendarId) {
            // Ensure the User is a member of the Calendar and has enough rights
            const calendarMembership = await this.calendarRepository.getCalendarMemberShip(
                calendarId,
                requestingUser.id,
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
                color: eventColor,
                description: eventDescription,
                endTime: endTime,
                location: eventLocation,
                name: eventName,
                startTime: startTime,
                type: eventType,
                visibility: eventVisibility,
            }),
            [{
                role: EventAttendeeRole.Admin,
                status: EventAttendeeStatus.Going,
                user: requestingUser,
            }],
            calendar
                ? { calendar: calendar }
                : undefined,
        );

        // Invite all Calendar members to the Event
        if (calendar) {
            // Select Calendar members to invite
            const calendarMembers = calendar.members!.filter(member => member.userId !== requestingUser.id);

            // Create and save invitations
            const attendees = calendarMembers.map(cm => ({
                role: calendarMemberRoleToEventAttendeeRole(cm.role),
                status: EventAttendeeStatus.Invited,
                user: cm.member!,
            }));
            const eventAttendees = await this.eventRepository.addUsersToEvent(createdEvent, attendees);

            // Update Event object attendees list
            createdEvent.attendees = createdEvent.attendees!.concat(eventAttendees);
        }

        res.status(201).json({
            event: this.eventView.formatEventWithAttendeesAndCalendars(createdEvent),
            message: "Event created",
        });
    }

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
                exceptCalendarIds: exceptCalendarIds,
                onlyCalendarIds: onlyCalendarIds,
                // We made sure that no statuses are undefined previously
                onlyStatuses: <EventAttendeeStatus[] | undefined> onlyStatuses,
            },
        );

        res.status(200).json({
            events: eventStatuses.map(this.eventView.formatEventWithStatusAndCalendars),
            message: "OK",
        });
    }

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
            event: this.eventView.formatEventWithAttendeesAndCalendars(event),
            message: "OK",
        });
    }

    public readonly editEventInfo = async (req: Request, res: Response) => {
        const requestingUser = getRequestingUser(req);

        // Validate eventId
        const eventId: number = parseInt(req.params.eventId, 10);
        if (isNaN(eventId)) {
            throw Boom.notFound(`Event id "${req.params.eventId}" is invalid`);
        }

        // Validate event parameter
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

        // Make sure User can edit this Event
        const eventStatus = await this.eventRepository.getEventRelationship(
            eventId,
            requestingUser.id,
            { joinEvent: true },
        );
        if (!eventStatus
            || !this.eventPolicy.userCanEditEvent(eventStatus)) {
            throw Boom.notFound("You cannot access this Event");
        }

        if (eventStatus.event === undefined) {
            throw new Error(`"event" property missing in EventAttendee`);
        }

        // Edit Event
        const event = eventStatus.event;
        event.name = eventName;
        event.startTime = eventStart;
        event.endTime = eventEnd;
        event.type = eventType;
        event.visibility = eventVisibility;
        event.description = eventDescription;
        event.location = eventLocation;
        event.color = eventColor;

        // Save Event
        const editedEvent = await this.eventRepository.updateEvent(event);

        res.status(200).json({
            event: this.eventView.formatEvent(editedEvent),
            message: "Event edited",
        });
    }

    public readonly deleteEvent = async (req: Request, res: Response) => {
        const requestingUser = getRequestingUser(req);

        // Validate eventId
        const eventId: number = parseInt(req.params.eventId, 10);
        if (isNaN(eventId)) {
            throw Boom.notFound(`Event id "${req.params.eventId}" is invalid`);
        }

        // Make sure User has enough rights to remove this Event
        const eventStatus = await this.eventRepository.getEventRelationship(eventId, requestingUser.id);
        if (!eventStatus
            || !this.eventPolicy.userCanDeleteEvent(eventStatus)) {
            throw Boom.notFound("You cannot access this Event");
        }

        // Delete Event
        await this.eventRepository.deleteEvent(eventId);

        res.status(200).json({
            message: "Event deleted",
        });
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
        this.eventImageStorageService.storeImage(req.file.path, req.file.mimetype, eventId);

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
        const imagePath = this.eventImageStorageService.getImageOrDefault(
            event.id,
            this.eventImageDefault,
        );

        res.status(200).sendFile(imagePath);
    }
}
