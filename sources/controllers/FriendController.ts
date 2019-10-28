import Boom from "@hapi/boom";
import { Request, Response } from "express";
import { getRequestingUser } from "../middleware/utils/getRequestingUser";
import { UserFriendship } from "../models/entities/UserFriendship";

export class FriendController {

    private  readonly userFriendship: UserFriendship;

    constructor(userFriendship: UserFriendship) {
        this.userFriendship = userFriendship;
    }

    public readonly inviteUser = async (req: Request, res: Response) => {
        this.userFriendship.requestingUser  = getRequestingUser(req);
        const userId = parseInt(req.params.userId, 10);
        if (isNaN(userId)) {
            throw Boom.notFound(`User id ${userId} not found`);
        }
        if (userId === this.userFriendship.requestingUser.id) {
            throw Boom.notFound("Operation forbidden");
        }
        res.status(200).json({
            userId: userId,
            message: `Invite sent to Id : ${userId}` ,
        });
    }

    public readonly inviteAccept = async (req: Request, res: Response) => {
        this.userFriendship.requestingUser = getRequestingUser(req);
        const userId = parseInt(req.params.userId, 10);
        if (isNaN(userId)) {
            throw Boom.notFound(`User id ${userId} not found`);
        }
        this.userFriendship.requestedId = userId;
        this.userFriendship.confirmed = true;
        res.status(200).json({
            message: `Invitation from Id : ${userId} accepted`,
        });
    }

    public readonly inviteDecline = async (req: Request, res: Response) => {
        this.userFriendship.requestingUser = getRequestingUser(req);
        const userId = parseInt(req.params.userId, 10);
        if (isNaN(userId)) {
            throw Boom.notFound(`User id ${userId} not found`);
        }
        this.userFriendship.requestedId = userId;
        this.userFriendship.confirmed = false;
        res.status(200).json({
            message: `Invitation from Id : ${userId} declined`,
        });
    }

    public readonly getAllFriends = async (req: Request, res: Response) => {
        this.userFriendship.requestingUser = getRequestingUser(req);
        res.status(200).json({
            message: "Get All Friends",
        });
    }

    public readonly deleteFriend = async (req: Request, res: Response) => {
        this.userFriendship.requestingUser = getRequestingUser(req);
        const userId = parseInt(req.params.userId, 10);
        if (isNaN(userId)) {
            throw Boom.notFound(`User id ${userId} not found`);
        }
        if (userId === this.userFriendship.requestingUser.id) {
            throw Boom.notFound("Operation forbidden");
        }
        this.userFriendship.requestedId = userId;
        this.userFriendship.confirmed = false;
        res.status(200).json({
            message: `Friend with Id : ${userId} deleted`,
        });
    }
}
