import { Request, Response } from "express";
import Boom from "@hapi/boom";

import UserRepository from "../models/UserRepository";

import UserView from "../views/UserView";

import EmailValidator from "../validators/EmailValidator";
import NameValidator from "../validators/NameValidator";

import { trim } from "../utils/string/trim";
import { getRequestingUser } from "../middleware/utils/getRequestingUser";


class UserController {

    private readonly userRepository: UserRepository;

    private readonly userView: UserView;

    private readonly emailValidator: EmailValidator;
    private readonly nameValidator: NameValidator;

    constructor(
        // Repositories
        userRepository: UserRepository,

        // Views
        userView: UserView,

        // Validators
        emailValidator: EmailValidator,
        nameValidator: NameValidator
    ) {
        this.userRepository = userRepository;
        this.userView = userView;
        this.emailValidator = emailValidator;
        this.nameValidator = nameValidator;
    }

    public readonly getMyInfo = (req: Request, res: Response) => {
        const requestingUser = getRequestingUser(req);

        res.status(200).json({
            message: "OK",
            user: this.userView.formatPrivateUser(requestingUser)
        });
    };

    public readonly updateMyInfo = async (req: Request, res: Response) => {
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
            user: this.userView.formatPrivateUser(updatedUser)
        });
    };

    public readonly updateTimezone = async (req: Request, res: Response) => {
        const requestingUser = getRequestingUser(req);

        // Validate request's parameters
        const newTimezone = parseInt(req.body.timezone, 10);
        if (!newTimezone) {
            throw Boom.badRequest("No valid timezone provided");
        }

        // Update timezone
        requestingUser.timezone = newTimezone;
        await this.userRepository.updateUser(requestingUser);

        res.status(200).json({
            message: "Timezone updated"
        });
    };
}


export default UserController;
