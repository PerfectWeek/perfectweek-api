import Boom from "@hapi/boom";
import { NextFunction, Request, Response } from "express";

import { UserRepository } from "../models/UserRepository";

import { JwtService } from "../services/JwtService";

export type AuthenticatedOnlyMiddleware = (req: Request, res: Response, next?: NextFunction) => Promise<void>;

const BEARER: string = "Bearer ";

export function generateAuthenticatedOnlyMiddleware(
    userRepository: UserRepository,
    jwtService: JwtService,
): AuthenticatedOnlyMiddleware {
    return async (req: Request, _res: Response, next?: NextFunction) => {
        // Check "authorization" header
        const authorization = req.headers.authorization;
        if (!authorization) {
            throw Boom.unauthorized("You must be authenticated to perform this action");
        }

        // Make sure it respects the "Bearer" format
        if (!authorization.startsWith(BEARER)) {
            throw Boom.badRequest("Invalid authorization format: Bearer expected");
        }

        // Parse token
        const token = authorization.substring(BEARER.length);
        const userId = decodeUserToken(jwtService, token);
        if (!userId) {
            throw Boom.unauthorized("Invalid token");
        }

        // Retrieve corresponding User
        const user = await userRepository.getUserById(userId);
        if (!user) {
            throw Boom.unauthorized("Invalid token");
        }

        // Add User to Request object
        (<any> req).user = user;

        if (next) {
            next();
        }
    };
}

//
// Helpers
//
function decodeUserToken(jwtService: JwtService, token: string): number | undefined {
    try {
        const { id: userId }: { id: number } = jwtService.decode(token);
        return userId;
    } catch (_) {
        return undefined;
    }
}
