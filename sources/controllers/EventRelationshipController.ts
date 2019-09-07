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
}

type AttendeeQueryParam = {
    id: number,
    role: EventAttendeeRole,
};
