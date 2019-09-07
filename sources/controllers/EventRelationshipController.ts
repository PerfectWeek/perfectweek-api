import Boom from "@hapi/boom";
import { Request, Response } from "express";
import { isArray } from "util";

import { EventRepository } from "../models/EventRepository";
import { UserRepository } from "../models/UserRepository";

import { EventPolicy } from "../policies/EventPolicy";

import { getRequestingUser } from "../middleware/utils/getRequestingUser";

import { EventView } from "../views/EventView";

import { EventAttendeeRole, eventAttendeeRoleFromString } from "../core/enums/EventAttendeeRole";
import { EventAttendeeStatus, eventAttendeeStatusFromString } from "../core/enums/EventAttendeeStatus";
import { EventAttendee } from "../models/entities/EventAttendee";

export class EventRelationshipController {

    private readonly eventRepository: EventRepository;
    private readonly userRepository: UserRepository;

    private readonly eventPolicy: EventPolicy;

    private readonly eventView: EventView;

    constructor(
        // Repositories
        eventRepository: EventRepository,
        userRepository: UserRepository,
        // Polices
        eventPolicy: EventPolicy,
        // Views
        eventView: EventView,
    ) {
        this.eventRepository = eventRepository;
        this.userRepository = userRepository;
        this.eventPolicy = eventPolicy;
        this.eventView = eventView;
    }

    public readonly inviteAttendees = async (req: Request, res: Response) => {
        const requestingUser = getRequestingUser(req);

        // Validate request's parameters
        const eventId = parseInt(req.params.eventId, 10);
        if (isNaN(eventId)) {
            throw Boom.badRequest(`Invalid event_id "${req.params.eventId}"`);
        }
        if (!isArray(req.body.attendees)) {
            throw Boom.badRequest(`"attendees" must be an array`);
        }
        const attendeesQueryIds = new Set<number>(); // Used to detect duplicates in the list
        const attendeesQuery: AttendeeQueryParam[] = req.body.attendees.map((a: any) => {
            const id = parseInt(a.id, 10);
            const role = eventAttendeeRoleFromString(a.role);
            if (isNaN(id)) {
                throw Boom.badRequest(`Invalid attendee id "${a.id}"`);
            }
            if (!role) {
                throw Boom.badRequest(`Invalid attendee role "${a.role}"`);
            }
            if (attendeesQueryIds.has(id)) {
                throw Boom.badRequest("The member list contains duplicates ids");
            }
            attendeesQueryIds.add(id);

            return {
                id: id,
                role: role,
            };
        });

        // Check if Event exists
        const event = await this.eventRepository.getEventWithAttendees(eventId);
        if (!event) {
            throw Boom.notFound(`Event id ${eventId} does not exist`);
        }

        // Check if the requesting User can invite others in this Event
        const eventRelationship = await this.eventRepository.getEventRelationship(
            eventId,
            requestingUser.id,
        );
        if (!this.eventPolicy.eventIsPublic(event)
            && (!eventRelationship || !this.eventPolicy.userCanInviteToEvent(eventRelationship))) {
            throw Boom.unauthorized("You cannot invite attendees in this Event");
        }

        // Check if all Users exist
        const attendeesToAdd = await Promise.all(attendeesQuery.map(async a => {
            const user = await this.userRepository.getUserById(a.id);
            if (!user) {
                throw Boom.notFound(`User "${a.id}" does not exist`);
            }
            return {
                user: user,
                role: a.role,
                status: EventAttendeeStatus.Invited,
            };
        }));

        // Make sure users are not already in Event
        if (!event.attendees) {
            throw new Error("Event.attendees should be defined");
        }
        const alreadyInAttendee = attendeesToAdd
            .find(a => event.attendees!.find(ea => {
                return ea.userId === a.user.id && ea.status !== EventAttendeeStatus.None;
            }) !== undefined);
        if (alreadyInAttendee) {
            throw Boom.conflict(`User ${alreadyInAttendee.user.id} is already related to this Event`);
        }

        // Save new Attendees
        const newAttendeesList = await this.eventRepository.addUsersToEvent(
            event,
            attendeesToAdd,
        );

        res.status(200).json({
            message: "OK",
            attendees: newAttendeesList.map(this.eventView.formatEventAttendee),
        });
    }

    public readonly updateSelfStatus = async (req: Request, res: Response) => {
        const requestingUser = getRequestingUser(req);

        // Validate request's arguments
        const eventId = parseInt(req.params.eventId, 10);
        if (!eventId) {
            throw Boom.badRequest(`Invalid event_id "${req.params.eventId}"`);
        }
        const newStatus = eventAttendeeStatusFromString(req.body.status);
        if (!newStatus) {
            throw Boom.badRequest(`Invalid Event status "${req.body.status}"`);
        }

        // Retrieve Event
        const event = await this.eventRepository.getEventById(eventId);
        if (!event) {
            throw Boom.notFound("Event does not exist");
        }

        // Make sure the requesting User can set his status for this Event
        let eventRelationship: EventAttendee | undefined;
        eventRelationship = await this.eventRepository.getEventRelationship(eventId, requestingUser.id);
        if (!this.eventPolicy.eventIsPublic(event)
            && !eventRelationship) {
            throw Boom.unauthorized("You cannot access this Event");
        }
        if (!eventRelationship) {
            eventRelationship = new EventAttendee({
                eventId: eventId,
                userId: requestingUser.id,
                role: EventAttendeeRole.Spectator,
                status: EventAttendeeStatus.None,
            });
        }

        // Set new status and save
        eventRelationship.status = newStatus;
        this.eventRepository.updateEventRelationship(eventRelationship);

        res.status(200).json({
            message: "Status updated",
        });
    }

    public readonly updateAttendeeRole = async (req: Request, res: Response) => {
        const requestingUser = getRequestingUser(req);

        // Validate request's arguments
        const eventId = parseInt(req.params.eventId, 10);
        if (!eventId) {
            throw Boom.badRequest(`Invalid event_id "${req.params.eventId}"`);
        }
        const userId = parseInt(req.params.userId, 10);
        if (!userId) {
            throw Boom.badRequest(`Invalid user_id "${req.params.userId}"`);
        }
        const newRole = eventAttendeeRoleFromString(req.body.role);
        if (!newRole) {
            throw Boom.badRequest(`Invalid Event role "${req.body.role}"`);
        }

        // Retrieve Event
        const event = await this.eventRepository.getEventById(eventId);
        if (!event) {
            throw Boom.notFound("Event does not exist");
        }

        // Make sure requesting User is related to the Event
        const eventRelationship = await this.eventRepository.getEventRelationship(
            eventId,
            requestingUser.id,
        );
        if (!eventRelationship) {
            throw Boom.unauthorized(`You cannot access this Event`);
        }

        // Make sure the requesting User can edit roles
        if (requestingUser.id === userId) { // The requesting User is updating itself
            if (!this.eventPolicy.userCanSetItsRoleTo(eventRelationship, newRole)) {
                throw Boom.unauthorized(`As a "${eventRelationship.role}", you cannot edit your role to ${newRole}`);
            }
            // Update role
            eventRelationship.role = newRole;
            await this.eventRepository.updateEventRelationship(eventRelationship);
        }
        else { // The requesting User is updating someone else
            const userEventRelationship = await this.eventRepository.getEventRelationship(eventId, userId);
            if (!userEventRelationship) {
                throw Boom.badRequest(`User "${userId}" is not related to this Event`);
            }
            if (!this.eventPolicy.userCanEditRoles(eventRelationship)) {
                throw Boom.unauthorized(`You do not have enough rights to edit roles`);
            }
            // Update role
            userEventRelationship.role = newRole;
            await this.eventRepository.updateEventRelationship(userEventRelationship);
        }

        res.status(200).json({
            message: "Role updated",
        });
    }
}

type AttendeeQueryParam = {
    id: number,
    role: EventAttendeeRole,
};
