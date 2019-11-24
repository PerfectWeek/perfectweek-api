import Boom from "@hapi/boom";
import { Request, Response } from "express";
import { isArray } from "util";

import { CalendarMember } from "../models/entities/CalendarMember";

import { CalendarRepository } from "../models/CalendarRepository";
import { EventRepository } from "../models/EventRepository";
import { UserRepository } from "../models/UserRepository";

import { NotificationService, sendNotificationToUser } from "../services/notification/NotificationService";

import { CalendarPolicy } from "../policies/CalendarPolicy";

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

    private readonly calendarView: CalendarView;

    constructor(
        // Repositories
        calendarRepository: CalendarRepository,
        eventRepository: EventRepository,
        userRepository: UserRepository,
        // Services
        private readonly notificationService: NotificationService,
        // Policies
        calendarPolicy: CalendarPolicy,
        // Views
        calendarView: CalendarView,
    ) {
        this.calendarRepository = calendarRepository;
        this.eventRepository = eventRepository;
        this.userRepository = userRepository;
        this.calendarPolicy = calendarPolicy;
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

        // Add users in Calendar
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

            // Notify user
            sendNotificationToUser(this.notificationService, m.user.id, {
                title: "Calendar invitation",
                description: `You have been invited to join the Calendar: ${calendar.name}`,
                eventType: "calendar_member_invite",
                payload: {
                    calendarId: calendar.id,
                },
            });
        }));

        res.status(200).json({
            message: "OK",
            members: newMembersList.map(this.calendarView.formatCalendarMember),
        });
    }

    public readonly acceptMemberInvite = async (req: Request, res: Response) => {
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

    public readonly declineMemberInvite = async (req: Request, res: Response) => {
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

    public readonly editMemberRole = async (req: Request, res: Response) => {
        const requestingUser = getRequestingUser(req);

        // Validate request's parameters
        const calendarId = parseInt(req.params.calendarId, 10);
        if (isNaN(calendarId)) {
            throw Boom.badRequest(`Invalid calendar_id "${req.params.calendarId}"`);
        }
        const userId = parseInt(req.params.userId, 10);
        if (isNaN(userId)) {
            throw Boom.badRequest(`Invalid user_id "${req.params.userId}"`);
        }
        const role = calendarMemberRoleFromString(req.body.role);
        if (!role) {
            throw Boom.badRequest(`Invalid role "${req.body.role}"`);
        }

        // Check if the requesting User is a member of the Calendar
        const requestingUserMembership = await this.calendarRepository.getCalendarMemberShip(
            calendarId,
            requestingUser.id,
        );
        if (!requestingUserMembership) {
            throw Boom.forbidden("You do not have access to this Calendar");
        }

        // Check if Requesting User has enough rights to edit roles
        if (!this.calendarPolicy.userCanEditMembers(requestingUserMembership)) {
            throw Boom.forbidden("You cannot edit members' roles");
        }

        let userToEditMembership: CalendarMember | undefined;
        if (requestingUser.id === userId) {
            // Requesting User edits himself
            userToEditMembership = requestingUserMembership;
        }
        else {
            // Requesting User edits someone else

            // Check if User is part of the Calendar
            userToEditMembership = await this.calendarRepository.getCalendarMemberShip(calendarId, userId);
            if (!userToEditMembership) {
                throw Boom.notFound("The User to edit is not part of the Calendar");
            }
        }

        // Edit role
        userToEditMembership.role = role;
        await this.calendarRepository.updateMembership(userToEditMembership);

        res.status(200).json({
            message: "Role edited",
        });
    }

    public readonly deleteMember = async (req: Request, res: Response) => {
        const requestingUser = getRequestingUser(req);

        // Validate request's parameters
        const calendarId = parseInt(req.params.calendarId, 10);
        if (isNaN(calendarId)) {
            throw Boom.badRequest(`Invalid calendar_id "${req.params.calendarId}"`);
        }
        const userId = parseInt(req.params.userId, 10);
        if (isNaN(userId)) {
            throw Boom.badRequest(`Invalid user_id "${req.params.userId}"`);
        }

        // Check if the requesting User is a member of the Calendar
        const requestingUserMembership = await this.calendarRepository.getCalendarMemberShip(
            calendarId,
            requestingUser.id,
        );
        if (!requestingUserMembership) {
            throw Boom.forbidden("You do not have access to this Calendar");
        }

        let userToEditMembership: CalendarMember | undefined;
        if (requestingUser.id === userId) {
            // Requesting User removes himself
            userToEditMembership = requestingUserMembership;
        }
        else {
            // Requesting User removes someone else

            // Check if Requesting User has enough rights to remove members
            if (!this.calendarPolicy.userCanEditMembers(requestingUserMembership)) {
                throw Boom.forbidden("You cannot remove members");
            }

            // Check if User is part of the Calendar
            userToEditMembership = await this.calendarRepository.getCalendarMemberShip(calendarId, userId);
            if (!userToEditMembership) {
                throw Boom.notFound("The User to remove is not part of the Calendar");
            }
        }

        // Remove member
        await this.calendarRepository.deleteMembership(userToEditMembership);

        res.status(200).json({
            message: "Member removed",
        });
    }
}

type MemberQueryParam = {
    id: number;
    role: CalendarMemberRole;
};
