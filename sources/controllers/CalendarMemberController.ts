import Boom from "@hapi/boom";
import { Request, Response } from "express";
import { isArray } from "util";

import { CalendarRepository } from "../models/CalendarRepository";
import { EventRepository } from "../models/EventRepository";
import { UserRepository } from "../models/UserRepository";

import { CalendarPolicy } from "../policies/CalendarPolicy";

import { CalendarInviteView } from "../views/CalendarInviteView";
import { CalendarView } from "../views/CalendarView";

import { getRequestingUser } from "../middleware/utils/getRequestingUser";

import { CalendarMemberRole, calendarMemberRoleFromString } from "../core/enums/CalendarMemberRole";
import { EventAttendeeStatus } from "../core/enums/EventAttendeeStatus";

import { calendarMemberRoleToEventAttendeeRole } from "./utils/calendarMemberRoleToEventAttendeeRole";

export class CalendarMemberController {

    private readonly calendarRepository: CalendarRepository;
    private readonly eventRepository: EventRepository;
    private readonly userRepository: UserRepository;

    private readonly calendarPolicy: CalendarPolicy;

    private readonly calendarInviteView: CalendarInviteView;
    private readonly calendarView: CalendarView;

    constructor(
        // Repositories
        calendarRepository: CalendarRepository,
        eventRepository: EventRepository,
        userRepository: UserRepository,
        // Policies
        calendarPolicy: CalendarPolicy,
        // Views
        calendarInviteView: CalendarInviteView,
        calendarView: CalendarView,
    ) {
        this.calendarRepository = calendarRepository;
        this.eventRepository = eventRepository;
        this.userRepository = userRepository;
        this.calendarPolicy = calendarPolicy;
        this.calendarInviteView = calendarInviteView;
        this.calendarView = calendarView;
    }

    public readonly inviteMembers = async (req: Request, res: Response) => {
        const requestingUser = getRequestingUser(req);

        // Validate request's parameters
        const calendarId = parseInt(req.params.calendarId, 10);
        if (isNaN(calendarId)) {
            throw Boom.badRequest(`Calendar id "${req.params.calendarId}" is invalid`);
        }
        if (!isArray(req.body.members)) {
            throw Boom.badRequest(`"members" must be an array`);
        }
        const membersQueryIds = new Set<number>(); // To detect duplicates in the list
        const membersQuery: MemberQueryParam[] = req.body.members.map((m: any) => {
            const id = parseInt(m.id, 10);
            const role = calendarMemberRoleFromString(m.role);
            if (isNaN(id)) {
                throw Boom.badRequest(`Invalid member id "${m.id}"`);
            }
            if (!role) {
                throw Boom.badRequest(`Invalid member role "${m.role}"`);
            }
            if (membersQueryIds.has(m.id)) {
                throw Boom.badRequest("The member list contains duplicates ids");
            }
            membersQueryIds.add(m.id);

            return {
                id: id,
                role: role,
            };
        });

        // Check if Calendar exists
        const calendar = await this.calendarRepository.getCalendarWithMembers(calendarId);
        if (!calendar) {
            throw Boom.notFound(`Calendar id ${calendarId} does not exist`);
        }

        // Check if the requesting User can invite others in this Calendar
        const calendarMembership = await this.calendarRepository.getCalendarMemberShip(
            calendarId,
            requestingUser.id,
        );
        if (!calendarMembership
            || !this.calendarPolicy.userCanInviteMembers(calendarMembership)) {
            throw Boom.forbidden("You cannot add members to this Calendar");
        }

        // Check if all Users exist
        const membersToAdd = await Promise.all(membersQuery.map(async m => {
            const user = await this.userRepository.getUserById(m.id);
            if (!user) {
                throw Boom.notFound(`User "${m.id}" does not exist`);
            }
            return {
                user: user,
                role: m.role,
                invitationConfirmed: false,
            };
        }));

        // Make sure users are not already in calendar
        if (!calendar.members) {
            throw new Error("Calendar.members should be defined");
        }
        const alreadyInMember = membersToAdd
            .find(m => calendar.members!.find(cm => cm.userId === m.user.id) !== undefined);
        if (alreadyInMember) {
            throw Boom.conflict(`User ${alreadyInMember.user.id} is already a member of the Calendar`);
        }

        // Add users in calendar
        const newMembersList = await this.calendarRepository.addMembersToCalendar(
            calendar,
            membersToAdd,
        );

        // Create relationship between Users and all Calendar's Events
        await Promise.all(membersToAdd.map(async m => {
            const role = calendarMemberRoleToEventAttendeeRole(m.role);
            // Get all Events the User is not already part of
            const events = await this.eventRepository.getAllEventFromCalendarWhereUserIsNotPartOf(
                calendar,
                m.user,
            );
            // Create and save new Attendees
            const eventAttendees = events.map(e => ({
                event: e,
                role: role,
                status: EventAttendeeStatus.None,
            }));
            await this.eventRepository.associateUserToEvents(m.user, eventAttendees);
        }));

        res.status(200).json({
            message: "OK",
            members: newMembersList.map(this.calendarView.formatCalendarMember),
        });
    }

    public readonly getPendingInvites = async (req: Request, res: Response) => {
        const requestingUser = getRequestingUser(req);

        // Retrieve pendings invites
        const pendingInvites = await this.calendarRepository.getPendingInvitesForUser(requestingUser);

        res.status(200).json({
            message: "OK",
            invites: pendingInvites.map(this.calendarInviteView.formatCalendarInvite),
        });
    }

    public readonly acceptInvite = async (req: Request, res: Response) => {
        const requestingUser = getRequestingUser(req);

        // Validate request's parameters
        const calendarId = parseInt(req.params.calendarId, 10);
        if (isNaN(calendarId)) {
            throw Boom.badRequest(`Invalid calendar_id "${req.params.calendarId}"`);
        }

        // Retrieve invitation
        const calendarMembership = await this.calendarRepository.getCalendarMemberShip(
            calendarId,
            requestingUser.id,
        );
        if (!calendarMembership
            || calendarMembership.invitationConfirmed !== false) {
            throw Boom.badRequest("There is no pending invitation for this Calendar");
        }

        // Accept invitation
        calendarMembership.invitationConfirmed = true;
        await this.calendarRepository.updateMembership(calendarMembership);

        res.status(200).json({
            message: "Invitation accepted",
        });
    }

    public readonly declineInvite = async (req: Request, res: Response) => {
        const requestingUser = getRequestingUser(req);

        // Validate request's parameters
        const calendarId = parseInt(req.params.calendarId, 10);
        if (isNaN(calendarId)) {
            throw Boom.badRequest(`Invalid calendar_id "${req.params.calendarId}"`);
        }

        // Retrieve invitation
        const calendarMembership = await this.calendarRepository.getCalendarMemberShip(
            calendarId,
            requestingUser.id,
        );
        if (!calendarMembership
            || calendarMembership.invitationConfirmed !== false) {
            throw Boom.badRequest("There is no pending invitation for this Calendar");
        }

        // Delete invitation
        await this.calendarRepository.deleteMembership(calendarMembership);

        res.status(200).json({
            message: "Invitation declined",
        });
    }
}

type MemberQueryParam = {
    id: number,
    role: CalendarMemberRole,
};
