import { Request, Response } from "express";
import Boom from "@hapi/boom";

import UserRepository from "../models/UserRepository";

import User from "../models/entities/User";

import UserView from "../views/UserView";

import { getRequestingUser } from "../middleware/utils/getRequestingUser";


class UserController {

    private readonly userRepository: UserRepository;

    private readonly userView: UserView;

    constructor(
        // Repositories
        userRepository: UserRepository,

        // Views
        userView: UserView
    ) {
        this.userRepository = userRepository;
        this.userView = userView;
    }

    public readonly getMyInfo = (req: Request, res: Response) => {
        const requestingUser = getRequestingUser(req);

        res.status(200).json({
            message: "OK",
            user: this.userView.formatPrivateUser(requestingUser)
        });
    };

    public readonly updateTimezone = async (req: Request, res: Response) => {
        const requestingUser = getRequestingUser(req);

        const newTimezone = parseInt(req.body.timezone, 10);
        if (!newTimezone) {
            throw Boom.badRequest("No valid timezone provided");
        }

        const newUser: User = {
            ...requestingUser,
            timezone: newTimezone
        };
        await this.userRepository.updateUser(newUser);

        res.status(200).json({
            message: "Timezone updated"
        });
    };
}


export default UserController;
