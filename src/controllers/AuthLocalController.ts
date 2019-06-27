import { Request, Response } from "express";
import Boom from "@hapi/boom";
import Uuid from "uuid/v4";

import PendingUser from "../models/entities/PendingUser";
import User from "../models/entities/User";
import PendingUserRepository from "../models/PendingUserRepository";
import UserRepository from "../models/UserRepository";

import PasswordService from "../services/PasswordService";
import JwtService from "../services/JwtService";

import EmailValidator from "../validators/EmailValidator";
import NameValidator from "../validators/NameValidator";
import PasswordValidator from "../validators/PasswordValidator";

import { trim } from "../utils/string/trim";


class AuthLocalController {

    private readonly pendingUserRepository: PendingUserRepository
    private readonly userRepository: UserRepository;

    private readonly jwtService: JwtService;
    private readonly passwordService: PasswordService;

    private readonly emailValidator: EmailValidator;
    private readonly nameValidator: NameValidator;
    private readonly passwordValidator: PasswordValidator;

    constructor(
        pendingUserRepository: PendingUserRepository,
        userRepository: UserRepository,

        jwtService: JwtService,
        passwordService: PasswordService,

        emailValidator: EmailValidator,
        nameValidator: NameValidator,
        passwordValidator: PasswordValidator
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
                + "contain lowercase letters, uppercase letters, digits and symbols"
            );
        }

        const existingUser = await this.userRepository.getUserByEmail(userEmail);
        const existingPendingUser = await this.pendingUserRepository.getPendingUserByEmail(userEmail);
        if (existingUser || existingPendingUser) {
            throw Boom.conflict(`User with email "${userEmail}" already exists`);
        }

        const cipheredPassword = await this.passwordService.cipherPassword(userPassword);

        const uuid = Uuid();

        const pendingUser = new PendingUser({
            email: userEmail,
            name: userName,
            cipheredPassword: cipheredPassword,
            uuid: uuid
        });
        const createdPendingUser = await this.pendingUserRepository.createPendingUser(pendingUser);

        res.status(201).json({
            message: "User created",
            user: {
                id: createdPendingUser.id,
                name: createdPendingUser.name,
                email: createdPendingUser.email
            },
            uuid: createdPendingUser.uuid // TODO: only in dev mode
        });
    };

    public readonly validateEmail = async (req: Request, res: Response) => {
        const userUuid: string = req.params.uuid;

        const pendingUser = await this.pendingUserRepository.getPendingUserByUuid(userUuid);
        if (!pendingUser) {
            throw Boom.notFound("No matching user found");
        }

        const user = new User({
            name: pendingUser.name,
            email: pendingUser.email,
            cipheredPassword: pendingUser.cipheredPassword
        });

        await this.userRepository.createUser(user);
        await this.pendingUserRepository.deletePendingUserById(pendingUser.id);

        res.status(200).json({
            message: "Email validated"
        });
    };

    public readonly loginUser = async (req: Request, res: Response) => {
        const userEmail = trim(req.body.email);
        const userPassword = trim(req.body.password);

        if (!userEmail || !userPassword) {
            throw Boom.badRequest("Missing fields");
        }

        const user = await this.userRepository.getUserByEmail(userEmail);
        if (!user
            || !this.passwordService.validatePassword(user.cipheredPassword, userPassword)) {
            throw Boom.unauthorized("Invalid email or password");
        }

        const userToken = this.jwtService.tokenize({ id: user.id });

        res.status(200).json({
            message: "Success",
            token: userToken
        });
    };
}


export default AuthLocalController;
