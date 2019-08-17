import Boom from "@hapi/boom";
import { Request, Response } from "express";
import Uuid from "uuid/v4";

import { PendingUser } from "../models/entities/PendingUser";
import { User } from "../models/entities/User";
import { PendingUserRepository } from "../models/PendingUserRepository";
import { UserRepository } from "../models/UserRepository";

import { JwtService } from "../services/JwtService";
import { PasswordService } from "../services/PasswordService";

import { EmailValidator } from "../validators/EmailValidator";
import { NameValidator } from "../validators/NameValidator";
import { PasswordValidator } from "../validators/PasswordValidator";

import { trim } from "../utils/string/trim";

export class AuthLocalController {

    private readonly pendingUserRepository: PendingUserRepository;
    private readonly userRepository: UserRepository;

    private readonly jwtService: JwtService;
    private readonly passwordService: PasswordService;

    private readonly emailValidator: EmailValidator;
    private readonly nameValidator: NameValidator;
    private readonly passwordValidator: PasswordValidator;

    constructor(
        // Repositories
        pendingUserRepository: PendingUserRepository,
        userRepository: UserRepository,
        // Services
        jwtService: JwtService,
        passwordService: PasswordService,
        // Validators
        emailValidator: EmailValidator,
        nameValidator: NameValidator,
        passwordValidator: PasswordValidator,
    ) {
        this.pendingUserRepository = pendingUserRepository;
        this.userRepository = userRepository;

        this.jwtService = jwtService;
        this.passwordService = passwordService;

        this.emailValidator = emailValidator;
        this.nameValidator = nameValidator;
        this.passwordValidator = passwordValidator;
    }

    public readonly registerUser = async (req: Request, res: Response) => {
        const userName = trim(req.body.name);
        const userEmail = trim(req.body.email);
        const userPassword = trim(req.body.password);

        // Validate request's parameters
        if (!userName || !userEmail || !userPassword) {
            throw Boom.badRequest("Missing fields in user");
        }
        if (!this.emailValidator.validate(userEmail)) {
            throw Boom.badRequest("Invalid email format");
        }
        if (!this.nameValidator.validate(userName)) {
            throw Boom.badRequest("Name must be at least 1 character long");
        }
        if (!this.passwordValidator.validate(userPassword)) {
            throw Boom.badRequest(
                "Password must be at least 8 characters long and "
                + "contain lowercase letters, uppercase letters, digits and symbols",
            );
        }

        // Make sure the given "email" does not already exist
        const existingUser = await this.userRepository.getUserByEmail(userEmail);
        const existingPendingUser = await this.pendingUserRepository.getPendingUserByEmail(userEmail);
        if (existingUser || existingPendingUser) {
            throw Boom.conflict(`User with email "${userEmail}" already exists`);
        }

        // Cipher password
        const cipheredPassword = await this.passwordService.cipherPassword(userPassword);

        // Generate a new UUID for account validation
        const uuid = Uuid();

        // Create a new PendingUser
        const pendingUser = await this.pendingUserRepository.createPendingUser(new PendingUser({
            cipheredPassword: cipheredPassword,
            email: userEmail,
            name: userName,
            uuid: uuid,
        }));

        res.status(201).json({
            message: "User created",
            user: {
                email: pendingUser.email,
                id: pendingUser.id,
                name: pendingUser.name,
            },
            uuid: pendingUser.uuid, // TODO: only in dev mode
        });
    }

    public readonly validateEmail = async (req: Request, res: Response) => {
        const userUuid: string = req.params.uuid;

        // Match the given UUID with a PendingUser
        const pendingUser = await this.pendingUserRepository.getPendingUserByUuid(userUuid);
        if (!pendingUser) {
            throw Boom.notFound(`No matching user found for uuid "${userUuid}"`);
        }

        // Remove PendingUser and create a real User
        const user = await this.userRepository.createUser(new User({
            cipheredPassword: pendingUser.cipheredPassword,
            email: pendingUser.email,
            name: pendingUser.name,
        }));
        await this.pendingUserRepository.deletePendingUserById(pendingUser.id);

        // Create default Calendar for new User
        await this.userRepository.createDefaultCalendarForUser(user);

        res.status(200).json({
            message: "Email validated",
        });
    }

    public readonly authenticateUser = async (req: Request, res: Response) => {
        const userEmail = trim(req.body.email);
        const userPassword = trim(req.body.password);

        // Validate request's parameters
        if (!userEmail || !userPassword) {
            throw Boom.badRequest("Missing fields");
        }

        // Authenticate the User
        const user = await this.userRepository.getUserByEmail(userEmail);
        if (!user
            || !this.passwordService.validatePassword(user.cipheredPassword, userPassword)) {
            throw Boom.unauthorized("Invalid email or password");
        }

        // Generate a new session token
        const userToken = this.jwtService.tokenize({ id: user.id });

        res.status(200).json({
            message: "Success",
            token: userToken,
        });
    }
}
