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

        // Fetch User
        const user = await this.handleUserLogin(
            credentials.access_token!,
            credentials.refresh_token ? credentials.refresh_token : undefined,
            credentials.token_type ? credentials.token_type : undefined,
        );

        // Generate User token
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

    public readonly callbackMobile = async (req: Request, res: Response) => {
        // Validate request parameters
        const accessToken: string | undefined = req.body.access_token;
        if (!accessToken) {
            throw Boom.badRequest('Missing body attribute "accessToken"');
        }
        const refreshToken: string | undefined = req.body.refresh_token;

        // Fetch User
        const user = await this.handleUserLogin(
            accessToken,
            refreshToken,
        );

        // Generate User token
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

    private readonly handleUserLogin = async (
        accessToken: string,
        refreshToken?: string,
        tokenType?: string,
    ): Promise<User> => {
        // Fetch user profile
        const profile = await this.googleOauthService.getUserInfo(
            accessToken,
            refreshToken,
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
                    accessToken: accessToken,
                    refreshToken: refreshToken,
                    tokenType: tokenType,
                    googleCalendarListSyncToken: undefined,
                    syncedGoogleCalendars: {},
                },
                timezone: 0,
            }));
        }
        else if (!user.googleProviderPayload) {
            // User already exists but did not have google provider
            user.googleProviderPayload = {
                accessToken: accessToken,
                refreshToken: refreshToken,
                tokenType: tokenType,
                googleCalendarListSyncToken: undefined,
                syncedGoogleCalendars: {},
            };
            user = await this.userRepository.updateUser(user);
        }
        else if (refreshToken) {
            // Replace existing token
            user.googleProviderPayload.accessToken = accessToken;
            user.googleProviderPayload.refreshToken = refreshToken;
            user.googleProviderPayload.tokenType = tokenType;
            user = await this.userRepository.updateUser(user);
        }

        return user;
    }
}
