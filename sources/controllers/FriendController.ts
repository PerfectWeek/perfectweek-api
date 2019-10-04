import { Request, Response } from "express";

export class FriendController {
    public readonly inviteUser = async (_req: Request, res: Response) => {
        res.status(200).json({
            message: "Friend request sent",
        });
    }

    public readonly inviteAccept = async (_req: Request, res: Response) => {
        res.status(200).json({
            message: "Invitation accepted",
        });
    }

    public readonly inviteDecline = async (_req: Request, res: Response) => {
        res.status(200).json({
            message: "Invitation declined",
        });
    }

    public readonly getAllFriends = async (_req: Request, res: Response) => {
        res.status(200).json({
            message: "OK",
        });
    }

    public readonly deleteFriend = async (_req: Request, res: Response) => {
        res.status(200).json({
            message: "Friend deleted",
        });
    }
}
