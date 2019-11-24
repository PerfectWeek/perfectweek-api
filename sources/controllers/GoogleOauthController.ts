import Boom from "@hapi/boom";
import { Request, Response } from "express";

import { User } from "../models/entities/User";
import { UserRepository } from "../models/UserRepository";
import { GoogleApiService } from "../services/googleapi/GoogleApiService";
import { JwtService } from "../services/JwtService";

export class GoogleOauthController {

    constructor(
        // Repositories
        private readonly userRepository: UserRepository,
        // Services
        private readonly googleOauthService: GoogleApiService,
        private readonly jwtService: JwtService,
    ) { }

    public readonly getOauthUri = (_req: Request, res: Response) => {
        const authUrl = this.googleOauthService.generateAuthUrl();

        res.status(200).json({
            message: "OK",
            auth_url: authUrl,
        });
    }

    public readonly callback = async (req: Request, res: Response) => {
        // Validate request parameters
        const oauthCode: string | undefined = req.body.code;
        if (!oauthCode) {
            throw Boom.badRequest('Missing body attribute "code"');
        }

        // Validate code and receive credentials
        const credentials = await this.googleOauthService.getCredentialsFromCode(oauthCode);

        // Fetch user profile
        const profile = await this.googleOauthService.getUserInfo(
            credentials.access_token!,
            credentials.refresh_token ? credentials.refresh_token : undefined,
        );

        // Get corresponding User
        let user = await this.userRepository.getUserByEmail(profile.email!);
        if (!user) {
            // User does not exist, create new one
            user = await this.userRepository.createUser(new User({
                email: profile.email!,
                name: !!profile.name ? profile.name : "User",
                cipheredPassword: null,
                googleProviderPayload: {
                    accessToken: credentials.access_token!,
                    refreshToken: credentials.refresh_token ? credentials.refresh_token : undefined,
                    tokenType: credentials.token_type!,
                    googleCalendarListSyncToken: undefined,
                    syncedGoogleCalendars: {},
                },
                timezone: 0,
            }));
        }
        else if (!user.googleProviderPayload) {
            // User already exists but did not have google provider
            user.googleProviderPayload = {
                accessToken: credentials.access_token!,
                refreshToken: credentials.refresh_token ? credentials.refresh_token : undefined,
                tokenType: credentials.token_type!,
                googleCalendarListSyncToken: undefined,
                syncedGoogleCalendars: {},
            };
            user = await this.userRepository.updateUser(user);
        }
        else if (credentials.refresh_token) {
            // Replace existing token
            user.googleProviderPayload.accessToken = credentials.access_token!;
            user.googleProviderPayload.refreshToken = credentials.refresh_token;
            user.googleProviderPayload.tokenType = credentials.token_type!;
            user = await this.userRepository.updateUser(user);
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
