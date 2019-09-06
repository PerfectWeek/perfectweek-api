import Boom from "@hapi/boom";
import { Request, Response } from "express";

import { UserRepository } from "../models/UserRepository";

import { EmailValidator } from "../validators/EmailValidator";
import { NameValidator } from "../validators/NameValidator";

import { UserView } from "../views/UserView";

import { getRequestingUser } from "../middleware/utils/getRequestingUser";

import { trim } from "../utils/string/trim";

export class UserController {

    private readonly userRepository: UserRepository;

    private readonly emailValidator: EmailValidator;
    private readonly nameValidator: NameValidator;

    private readonly userView: UserView;

    constructor(
        // Repositories
        userRepository: UserRepository,
        // Validators
        emailValidator: EmailValidator,
        nameValidator: NameValidator,
        // Views
        userView: UserView,
    ) {
        this.userRepository = userRepository;
        this.emailValidator = emailValidator;
        this.nameValidator = nameValidator;
        this.userView = userView;
    }

    public readonly getUser = (req: Request, res: Response) => {
        const requestingUser = getRequestingUser(req);

        res.status(200).json({
            message: "OK",
            user: this.userView.formatPrivateUser(requestingUser),
        });
    }

    public readonly updateUser = async (req: Request, res: Response) => {
        const requestingUser = getRequestingUser(req);

        const newEmail = trim(req.body.email);
        const newName = trim(req.body.name);

        // Validate request's parameters
        if (!newEmail || !newName) {
            throw Boom.badRequest("Missing fields in user");
        }
        if (!this.emailValidator.validate(newEmail)) {
            throw Boom.badRequest("Invalid email format");
        }
        if (!this.nameValidator.validate(newName)) {
            throw Boom.badRequest("Name must be at least 1 character long");
        }

        // Save new User info
        requestingUser.email = newEmail;
        requestingUser.name = newName;
        const updatedUser = await this.userRepository.updateUser(requestingUser);

        res.status(200).json({
            message: "OK",
            user: this.userView.formatPrivateUser(updatedUser),
        });
    }

    public readonly deleteUser = async (req: Request, res: Response) => {
        const requestingUser = getRequestingUser(req);

        await this.userRepository.deleteUser(requestingUser.id);

        res.status(200).json({
            message: "User deleted",
        });
    }

    public readonly updateUserTimezone = async (req: Request, res: Response) => {
        const requestingUser = getRequestingUser(req);

        // Validate request's parameters
        const newTimezone = parseInt(req.body.timezone, 10);
        if (isNaN(newTimezone)) {
            throw Boom.badRequest("No valid timezone provided");
        }

        // Update timezone
        requestingUser.timezone = newTimezone;
        await this.userRepository.updateUser(requestingUser);

        res.status(200).json({
            message: "Timezone updated",
        });
    }
}
