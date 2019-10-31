import Boom from "@hapi/boom";

import { Request, Response } from "express";
import { getRequestingUser } from "../middleware/utils/getRequestingUser";
import {UserRepository} from "../models/UserRepository";
import {UserView} from "../views/UserView";

export class FriendController {

    private readonly userRepository: UserRepository;
    private readonly userView: UserView;

    constructor(userRepository: UserRepository, userView: UserView){
        this.userRepository = userRepository;
        this.userView = userView;
    }

    public readonly inviteUser = async (req: Request, res: Response) => {
        const user = getRequestingUser(req);

        const friendId = parseInt(req.params.userId, 10);
        if (isNaN(friendId)) {
            throw Boom.notFound(`User id "${req.params.userId}" not found A`);
        }


        const friend = await this.userRepository.getUserById(friendId);
        if (!friend) {
            throw Boom.notFound(`User id "${req.params.userId}" not found B`);
        }

        const existingFriendship = await this.userRepository.getUserFriendship(user.id, friend.id);
        if (existingFriendship) {
            throw Boom.forbidden("You cannot invite this user again");
        }

        const newFriendship = this.userRepository.createUserFriendship(user.id, friendId);
        const friendsQuery: () => { id: number; confirmed: boolean } = (() => {
            return {
                id: friendId,
                confirmed: newFriendship.confirmed,
            };
        });
        res.status(200).json({
            test: friendsQuery,
            message: "Invitation Sent",
        });
    }

    public readonly inviteAccept = async (_req: Request, res: Response) => {
        res.status(200).json({
            message: "Invitation Accepted",
        });
    }

    public readonly inviteDecline = async (_req: Request, res: Response) => {
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
        const user = getRequestingUser(req);

        const friendId = parseInt(req.params.userId, 10);
        if (isNaN(friendId)) {
            throw Boom.notFound(`User id "${req.params.userId}" not found A`);
        }

        //Delete dans la db

        await this.userRepository.deleteUserFriendship(user.id, friendId);
        res.status(200).json({
            message: "Friend removed",
        });
    }
}
