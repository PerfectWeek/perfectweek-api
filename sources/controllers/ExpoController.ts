import Boom from "@hapi/boom";
import Expo from "expo-server-sdk";
import { Request, Response } from "express";

import { getRequestingUser } from "../middleware/utils/getRequestingUser";
import { NotificationService } from "../services/notification/NotificationService";
import { ExpoNotifier } from "../services/notification/notifiers/ExpoNotifier";

export class ExpoController {
    constructor(
        private readonly expo: Expo,
        private readonly notificationService: NotificationService,
    ) { }

    public readonly registerToken = async (req: Request, res: Response): Promise<void> => {
        const requestingUser = getRequestingUser(req);

        // Validate request's parameters
        const expoToken: string | undefined = req.body.token;
        if (!expoToken) {
            throw Boom.badRequest('Missing attribute "token"');
        }

        // Validate token
        if (!Expo.isExpoPushToken(expoToken)) {
            throw Boom.badRequest(`Invalid token "${expoToken}"`);
        }

        // Register token
        this.notificationService.addNotifier(requestingUser.id, new ExpoNotifier(this.expo, expoToken));

        res.status(200).json({
            message: "OK",
        });
    }
}
