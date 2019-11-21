import Boom from "@hapi/boom";
import { Request, Response } from "express";

import { UserFriendship } from "../models/entities/UserFriendship";
import { UserRepository } from "../models/UserRepository";
import { UserView } from "../views/UserView";

import { getRequestingUser } from "../middleware/utils/getRequestingUser";
import { parseBool } from "../utils/parseBool";

export class FriendController {

    private readonly userRepository: UserRepository;
    private readonly userView: UserView;

    constructor(
        // Repository
        userRepository: UserRepository,
        // View
        userView: UserView,
    ) {
        this.userRepository = userRepository;
        this.userView = userView;
    }

    public readonly inviteUser = async (req: Request, res: Response) => {
        const requestingUser = getRequestingUser(req);

        // Validate request's parameters
        const targetUserId = parseInt(req.params.userId, 10);
        if (isNaN(targetUserId)) {
            throw Boom.badRequest(`Invalid User id "${req.params.userId}"`);
        }

        // Make sure User is not inviting himself
        if (targetUserId === requestingUser.id) {
            throw Boom.forbidden("You cannot invite yourself");
        }

        // Check if user exists
        const targetUser = await this.userRepository.getUserById(targetUserId);
        if (!targetUser) {
            throw Boom.notFound(`User id "${req.params.userId}" does not exist`);
        }

        // Check existing friendship in both ways
        const existingFriendship1 = await this.userRepository.getUserFriendship(requestingUser.id, targetUser.id);
        const existingFriendship2 = await this.userRepository.getUserFriendship(targetUser.id, requestingUser.id);
        if (existingFriendship1 || existingFriendship2) {
            throw Boom.forbidden("An invitation has already been sent");
        }

        // Create new invitation
        await this.userRepository.createUserFriendship(new UserFriendship({
            requestingId: requestingUser.id,
            requestedId: targetUser.id,
            confirmed: false,
        }));

        res.status(200).json({
            message: "Invitation sent",
        });
    }

    public readonly inviteAccept = async (req: Request, res: Response) => {
        const requestingUser  = getRequestingUser(req);

        // Validate request's parameters
        const invitingUserId = parseInt(req.params.userId, 10);
        if (isNaN(invitingUserId)) {
            throw Boom.badRequest(`Invalid User id "${req.params.userId}"`);
        }

        // Check if user exists
        const invitingUser = await this.userRepository.getUserById(invitingUserId);
        if (!invitingUser) {
            throw Boom.notFound(`User id "${req.params.userId}" does not exist`);
        }

        // Check existing friendship
        const existingFriendship = await this.userRepository.getUserFriendship(invitingUser.id, requestingUser.id);
        if (!existingFriendship) {
            throw Boom.forbidden("No pending invitation from this User");
        }

        // Check if the friend is already in your friendlist
        if (existingFriendship.confirmed) {
            throw Boom.forbidden("This user is already in your friend list");
        }

        // Accept invitation
        await this.userRepository.updateUserFriendship(invitingUser.id, requestingUser.id, true);

        res.status(200).json({
            message: "Invitation accepted",
        });
    }

    public readonly inviteDecline = async (req: Request, res: Response) => {
        const requestingUser  = getRequestingUser(req);

        // Validate request's parameters
        const invitingUserId = parseInt(req.params.userId, 10);
        if (isNaN(invitingUserId)) {
            throw Boom.badRequest(`Invalid User id "${req.params.userId}"`);
        }

        // Check if user exists
        const invitingUser = await this.userRepository.getUserById(invitingUserId);
        if (!invitingUser) {
            throw Boom.notFound(`User id "${req.params.userId}" does not exist`);
        }

        // Retrieve friend invitation
        const existingFriendship = await this.userRepository.getUserFriendship(invitingUser.id, requestingUser.id);
        if (!existingFriendship) {
            throw Boom.forbidden("No pending invitation from this User");
        }

        // Make sure the invitation is not already confirmed
        if (existingFriendship.confirmed) {
            throw Boom.forbidden("Can't decline an already existing friendship");
        }

        // Delete Invitation
        await this.userRepository.deleteUserFriendship(invitingUser.id, requestingUser.id);

        res.status(200).json({
            message: "Invitation declined",
        });
    }

    public readonly getAllFriends = async (req: Request, res: Response) => {
        const requestingUser = getRequestingUser(req);

        // Recover query parameter
        const confirmed = parseBool(req.query.confirmed);

        // Recover sent and received friend request
        const sentRequests = await this.userRepository.getAllFriendRelationsSentForUserId(requestingUser.id, confirmed);
        const receivedRequests = await this.userRepository.getAllFriendRelationsReceivedForUserId(
            requestingUser.id,
            confirmed,
        );

        res.status(200).json({
            message: "OK",
            sent: sentRequests.map(this.userView.formatFriendship),
            received: receivedRequests.map(this.userView.formatFriendship),
        });
    }

    public readonly deleteFriend = async (req: Request, res: Response) => {
        const requestingUser = getRequestingUser(req);

        const targetUserId = parseInt(req.params.userId, 10);
        if (isNaN(targetUserId)) {
            throw Boom.notFound(`User id "${req.params.userId}" not found `);
        }

        const targetUser = await this.userRepository.getUserById(targetUserId);
        if (!targetUser) {
            throw Boom.notFound(`User id "${req.params.userId}" does not exist`);
        }

        if (targetUserId === requestingUser.id) {
            throw Boom.forbidden(`You cannot delete yourself`);
        }

        // Check existing friendship
        const existingFriendship1 = await this.userRepository.getUserFriendship(requestingUser.id, targetUser.id);
        const existingFriendship2 = await this.userRepository.getUserFriendship(targetUser.id, requestingUser.id);
        if (!existingFriendship1 && !existingFriendship2) {
            throw Boom.forbidden("No friendship to remove");
        }
        if (existingFriendship1) {
            await this.userRepository.deleteUserFriendship(requestingUser.id, targetUserId);
        }
        if (existingFriendship2){
            await this.userRepository.deleteUserFriendship(targetUserId, requestingUser.id);
        }

        res.status(200).json({
            message: "Friend removed",
        });
    }
}
