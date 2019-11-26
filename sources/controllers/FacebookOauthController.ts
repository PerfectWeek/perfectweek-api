import Boom from "@hapi/boom";
import { Request, Response } from "express";

import { UserRepository } from "../models/UserRepository";

import { FacebookApiService } from "../services/facebookApi/FacebookApiService";
import { JwtService } from "../services/JwtService";

import { User } from "../models/entities/User";

export class FacebookOauthController {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly facebookApiService: FacebookApiService,
        private readonly jwtService: JwtService,
    ) { }

    public readonly callback = async (req: Request, res: Response) => {
        // Validate request's parameters
        const accessToken: string | undefined = req.body.access_token;
        if (!accessToken) {
            throw Boom.badRequest('Missing attribute "access_token"');
        }

        // Retrieve User info
        const profile = await this.facebookApiService.getUserInfo(accessToken);
        if (!profile) {
            throw Boom.unauthorized("Could not retrieve User info");
        }

        // Retrieve User
        let user = await this.userRepository.getUserByEmail(profile.email);
        if (!user) {
            // User does not exist, create a new one
            user = await this.userRepository.createUser(new User({
                email: profile.email,
                name: profile.name,
                cipheredPassword: null,
                googleProviderPayload: null,
                timezone: 0,
            }));

            // Create default Calendar for new User
            await this.userRepository.createDefaultCalendarForUser(user);
        }

        // Get User token
        const userToken = this.jwtService.tokenize({ id: user.id });

        res.status(200).json({
            message: "OK",
            token: userToken,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
            },
        });
    }
}
