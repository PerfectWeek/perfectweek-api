import "reflect-metadata";
import { createConnection, Connection } from "typeorm";

import * as DbConfig from "./dbConfig";
import * as Router from "./router";

import Server from "./Server";

import ApiEndpointController from "./controllers/ApiEndpointController";
import AuthLocalController from "./controllers/AuthLocalController";
import UserController from "./controllers/UserController";

import JwtService from "./services/JwtService";
import PasswordService from "./services/PasswordService";

import UserView from "./views/UserView";

import PendingUserRepository from "./models/PendingUserRepository";
import UserRepository from "./models/UserRepository";

import EmailValidator from "./validators/EmailValidator";
import NameValidator from "./validators/NameValidator";
import PasswordValidator from "./validators/PasswordValidator";

import * as AuthenticatedOnlyMiddleware from "./middleware/authenticatedOnlyMiddleware";


const API_PORT: number = 3000;

function main(): void {
    const dbConfig = DbConfig.load("../ormconfig.js");

    const jwtSecretKey = process.env.JWT_SECRET_KEY;
    if (!jwtSecretKey) {
        throw new Error('Missing environment variable "JWT_SECRET_KEY"');
    }

    createConnection(dbConfig)
        .then((conn: Connection) => {
            console.info("Connected to database");

            const server = createServer(conn, jwtSecretKey);

            server.start(API_PORT);
        });
}

function createServer(conn: Connection, jwtSecretKey: string): Server {
    // Create Repositories
    const pendingUserRepository = new PendingUserRepository(conn);
    const userRepository = new UserRepository(conn);

    // Create Validators
    const emailValidator = new EmailValidator();
    const nameValidator = new NameValidator();
    const passwordValidator = new PasswordValidator();

    // Create Services
    const jwtService = new JwtService(jwtSecretKey);
    const passwordService = new PasswordService();

    // Create Views
    const userView = new UserView();

    // Create Controllers
    const apiEndpointController = new ApiEndpointController();
    const authLocalController = new AuthLocalController(
        pendingUserRepository,
        userRepository,
        jwtService,
        passwordService,
        emailValidator,
        nameValidator,
        passwordValidator
    );
    const userController = new UserController(
        userRepository,
        userView
    );

    // Create middlewares
    const authenticatedOnlyMiddleware = AuthenticatedOnlyMiddleware.generateAuthenticatedOnlyMiddleware(
        userRepository,
        jwtService
    );

    // Create Router
    const router = Router.createRouter(
        // Controller
        apiEndpointController,
        authLocalController,
        userController,

        // Middleware
        authenticatedOnlyMiddleware
    );

    return new Server(router);
}


// Run only if executed directly (e.g: `ts-node src/main.ts`)
if (require.main === module) {
    main();
}
