import Boom from "@hapi/boom";
import { Request, Response } from "express";

import { UserFriendship } from "../models/entities/UserFriendship";
import { UserRepository } from "../models/UserRepository";
import { UserView } from "../views/UserView";

import { getRequestingUser } from "../middleware/utils/getRequestingUser";

export class FriendController {

    private readonly userRepository: UserRepository;
    private readonly userView: UserView;

    constructor(userRepository: UserRepository, userView: UserView){
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

        if (targetUserId === requestingUser.id) {
            throw Boom.forbidden(`You cannot invite yourself`);
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
            throw Boom.forbidden("An invitation have already been sent");
        }

        // Create new invitation
        await this.userRepository.createUserFriendship(new UserFriendship({
            requestingId: requestingUser.id,
            requestedId: targetUser.id,
            confirmed: false,
        }));

        res.status(200).json({
            message: "Invitation Sent",
        });
    }

    public readonly inviteAccept = async (req: Request, res: Response) => {
        const requestingUser  = getRequestingUser(req);

        const targetUserId = parseInt(req.params.userId, 10);
        if (isNaN(targetUserId)) {
            throw Boom.badRequest(`Invalid User id "${req.params.userId}"`);
        }

        // Check if user exists
        const targetUser = await this.userRepository.getUserById(targetUserId);
        if (!targetUser) {
            throw Boom.notFound(`User id "${req.params.userId}" does not exist`);
        }

        if (targetUserId === requestingUser.id) {
            throw Boom.forbidden(`You cannot accept invite from yourself`);
        }

        // Check existing friendship
        const existingFriendship = await this.userRepository.getUserFriendship(targetUser.id, requestingUser.id);
        if (!existingFriendship) {
            throw Boom.forbidden("Friendship already exist");
        }

        if (existingFriendship.confirmed) {
            throw Boom.forbidden("This user is already in your friend list");
        }


        await this.userRepository.updateUserFriendship(requestingUser.id, targetUser.id, true);
        res.status(200).json({
            message: "Invitation Accepted",
        });
    }

    public readonly inviteDecline = async (req: Request, res: Response) => {
        const requestingUser  = getRequestingUser(req);

        const targetUserId = parseInt(req.params.userId, 10);
        if (isNaN(targetUserId)) {
            throw Boom.badRequest(`Invalid User id "${req.params.userId}"`);
        }

        // Check if user exists
        const targetUser = await this.userRepository.getUserById(targetUserId);
        if (!targetUser) {
            throw Boom.notFound(`User id "${req.params.userId}" does not exist`);
        }

        if (targetUserId === requestingUser.id) {
            throw Boom.forbidden(`You cannot decline invite from yourself`);
        }

        // Check existing friendship
        const existingFriendship = await this.userRepository.getUserFriendship(targetUser.id, requestingUser.id);
        if (!existingFriendship) {
            throw Boom.forbidden("Friendship already exist");
        }

        if (existingFriendship.confirmed) {
            throw Boom.forbidden("Can't decline an already existing friendship");
        }

        await this.userRepository.deleteUserFriendship(targetUser.id, requestingUser.id);
        res.status(200).json({
            message: "Invitation declined",
        });
    }

    public readonly getAllFriends = async (req: Request, res: Response) => {
        const user = getRequestingUser(req);


        const status: true | false | undefined = true;
        const friends = await this.userRepository.getAllFriendsForUserId(user.id, status);


        res.status(200).json({
            message: "OK",
            friends: friends.map(this.userView.formatFriendship),
        });
    }

    public readonly deleteFriend = async (req: Request, res: Response) => {
        const requestingUser = getRequestingUser(req);

        const targetUserId = parseInt(req.params.userId, 10);
        if (isNaN(targetUserId)) {
            throw Boom.notFound(`User id "${req.params.userId}" not found A`);
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
            throw Boom.forbidden("Users aren't friends");
        }
        if (existingFriendship1 && existingFriendship1.confirmed) {
            await this.userRepository.deleteUserFriendship(requestingUser.id, targetUserId);
        }
        else if (existingFriendship2 && existingFriendship2.confirmed){
            await this.userRepository.getUserFriendship(targetUserId, requestingUser.id);
        }
        res.status(200).json({
            message: "Friend removed",
        });
    }
}
