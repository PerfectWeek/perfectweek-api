import { Request, Response } from "express";
import Boom from "@hapi/boom";

import User from "../models/entities/User";
import UserRepository from "../models/UserRepository";

import PasswordService from "../services/PasswordService";
import JwtService from "../services/JwtService";

import EmailValidator from "../validators/EmailValidator";
import NameValidator from "../validators/NameValidator";
import PasswordValidator from "../validators/PasswordValidator";

import { trim } from "../utils/string/trim";


class AuthLocalController {

    private readonly userRepository: UserRepository;

    private readonly jwtService: JwtService;
    private readonly passwordService: PasswordService;

    private readonly emailValidator: EmailValidator;
    private readonly nameValidator: NameValidator;
    private readonly passwordValidator: PasswordValidator;

    constructor(
        userRepository: UserRepository,

        jwtService: JwtService,
        passwordService: PasswordService,

        emailValidator: EmailValidator,
        nameValidator: NameValidator,
        passwordValidator: PasswordValidator
    ) {
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
        if (existingUser) {
            throw Boom.conflict(`User with email "${userEmail}" already exists`);
        }

        const cipheredPassword = await this.passwordService.cipherPassword(userPassword);
        const user = new User({
            email: userEmail,
            name: userName,
            cipheredPassword: cipheredPassword
        });
        const createdUser = await this.userRepository.createUser(user);

        res.status(201).json({
            message: "User created",
            user: {
                id: createdUser.id,
                name: createdUser.name,
                email: createdUser.email
            }
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
