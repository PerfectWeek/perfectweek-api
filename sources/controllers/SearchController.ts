import Boom from "@hapi/boom";
import { Request, Response } from "express";

import { UserRepository } from "../models/UserRepository";
import { normalize } from "../utils/string/normalize";

export class SearchController {

    constructor(
        private readonly userRepository: UserRepository,
    ) { }

    public readonly searchUsers = async (req: Request, res: Response): Promise<void> => {
        // Validate request parameters
        const query = req.query.q !== undefined ? normalize(req.query.q) : undefined;
        if (query === undefined) {
            throw Boom.badRequest("Missing parameter \"q\"");
        }
        const limit = parseInt(req.query.limit || "5", 10);
        if (isNaN(limit) || limit < 0) {
            throw Boom.badRequest(`Invalid parameter limit: "${req.query.limit}"`);
        }

        // Retrieve all Users
        const allUsers = await this.userRepository.getAllUsers();

        // Filter and order matches
        const matchingUsers = allUsers
            .map(u => ({
                user: u,
                score: normalize(u.name).indexOf(query),
            }))
            .filter(({ score }) => score !== -1)
            .sort(({ score: score1 }, { score: score2 }) => score1 - score2)
            .slice(0, limit)
            .map(({ user }) => ({
                id: user.id,
                name: user.name,
            }));

        res.status(200).json({
            message: "OK",
            users: matchingUsers,
        });
    }
}
