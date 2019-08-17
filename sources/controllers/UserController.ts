import Boom from "@hapi/boom";
import { Request, Response } from "express";

import { UserRepository } from "../models/UserRepository";

import { ImageStorageService } from "../services/ImageStorageService";

import { UserView } from "../views/UserView";

import { EmailValidator } from "../validators/EmailValidator";
import { NameValidator } from "../validators/NameValidator";

import { getRequestingUser } from "../middleware/utils/getRequestingUser";
import { trim } from "../utils/string/trim";

export class UserController {

    private readonly userRepository: UserRepository;

    private readonly userProfileImageStorageService: ImageStorageService;

    private readonly userView: UserView;

    private readonly emailValidator: EmailValidator;
    private readonly nameValidator: NameValidator;

    private readonly userProfileImageDefault: string;

    constructor(
        // Repositories
        userRepository: UserRepository,
        // Services
        userProfileImageStorageService: ImageStorageService,
        // Views
        userView: UserView,
        // Validators
        emailValidator: EmailValidator,
        nameValidator: NameValidator,
        // Images
        userProfileImageDefault: string,
    ) {
        this.userRepository = userRepository;

        this.userProfileImageStorageService = userProfileImageStorageService;

        this.userView = userView;

        this.emailValidator = emailValidator;
        this.nameValidator = nameValidator;

        this.userProfileImageDefault = userProfileImageDefault;
    }

    public readonly getMyInfo = (req: Request, res: Response) => {
        const requestingUser = getRequestingUser(req);

        res.status(200).json({
            message: "OK",
            user: this.userView.formatPrivateUser(requestingUser),
        });
    }

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
            user: this.userView.formatPrivateUser(updatedUser),
        });
    }

    public readonly uploadImage = (req: Request, res: Response) => {
        const requestingUser = getRequestingUser(req);

        // Make sure an image has been uploaded
        if (!req.file) {
            throw Boom.badRequest("Missing image argument");
        }

        // Store User image
        this.userProfileImageStorageService.storeImage(req.file.path, req.file.mimetype, requestingUser.id);

        res.status(200).json({
            message: "Image uploaded",
        });
    }

    public readonly getUserImage = async (req: Request, res: Response) => {
        // Validate request's parameters
        const userId: number = parseInt(req.params.userId, 10);
        if (isNaN(userId)) {
            throw Boom.notFound(`User id "${req.params.userId}" not found`);
        }

        // Make sure User exists
        const user = await this.userRepository.getUserById(userId);
        if (!user) {
            throw Boom.notFound(`User id "${req.params.userId}" not found`);
        }

        // Retrieve User's profile picture
        const imagePath = this.userProfileImageStorageService.getImageOrDefault(
            user.id,
            this.userProfileImageDefault,
        );

        res.status(200).sendFile(imagePath);
    }

    public readonly updateTimezone = async (req: Request, res: Response) => {
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

    public readonly deleteUser = async (req: Request, res: Response) => {
        const requestingUser = getRequestingUser(req);

        await this.userRepository.deleteUser(requestingUser.id);

        res.status(200).json({
            message: "User deleted",
        });
    }
}
