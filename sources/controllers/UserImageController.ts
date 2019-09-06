import Boom from "@hapi/boom";
import { Request, Response } from "express";

import { UserRepository } from "../models/UserRepository";

import { ImageStorageService } from "../services/ImageStorageService";

import { getRequestingUser } from "../middleware/utils/getRequestingUser";

export class UserImageController {

    private readonly userRepository: UserRepository;

    private readonly profileImageStorageService: ImageStorageService;

    private readonly userProfileImageDefault: string;

    constructor(
        // Repositories
        userRepository: UserRepository,
        // Services
        profileImageStorageService: ImageStorageService,
        // Images
        userProfileImageDefault: string,
    ) {
        this.userRepository = userRepository;

        this.profileImageStorageService = profileImageStorageService;

        this.userProfileImageDefault = userProfileImageDefault;
    }

    public readonly uploadImage = (req: Request, res: Response) => {
        const requestingUser = getRequestingUser(req);

        // Make sure an image has been uploaded
        if (!req.file) {
            throw Boom.badRequest("Missing image argument");
        }

        // Store User image
        this.profileImageStorageService.storeImage(req.file.path, req.file.mimetype, requestingUser.id);

        res.status(200).json({
            message: "Image uploaded",
        });
    }

    public readonly getImage = async (req: Request, res: Response) => {
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
        const imagePath = this.profileImageStorageService.getImageOrDefault(
            user.id,
            this.userProfileImageDefault,
        );

        res.status(200).sendFile(imagePath);
    }
}
