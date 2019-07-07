import "reflect-metadata";
import { createConnection, Connection } from "typeorm";

import * as DbConfig from "./dbConfig";
import * as Router from "./router";

import Server from "./Server";

import CalendarView from "./views/CalendarView";
import EventView from "./views/EventView";
import UserView from "./views/UserView";

import CalendarRepository from "./models/CalendarRepository";
import EventRepository from "./models/EventRepository";
import PendingUserRepository from "./models/PendingUserRepository";
import UserRepository from "./models/UserRepository";

import JwtService from "./services/JwtService";
import PasswordService from "./services/PasswordService";

import EmailValidator from "./validators/EmailValidator";
import NameValidator from "./validators/NameValidator";
import PasswordValidator from "./validators/PasswordValidator";

import CalendarPolicy from "./policies/CalendarPolicy";

import ApiEndpointController from "./controllers/ApiEndpointController";
import AuthLocalController from "./controllers/AuthLocalController";
import CalendarController from "./controllers/CalendarController";
import EventController from "./controllers/EventController";
import UserController from "./controllers/UserController";

import * as AuthenticatedOnlyMiddleware from "./middleware/authenticatedOnlyMiddleware";


function main(): void {
    const dbConfig = DbConfig.load("../ormconfig.js");

    const apiPort = parseInt(process.env.PORT || "");
    if (!apiPort) {
        throw new Error('Missing environment variable "PORT"');
    }

    const jwtSecretKey = process.env.JWT_SECRET_KEY;
    if (!jwtSecretKey) {
        throw new Error('Missing environment variable "JWT_SECRET_KEY"');
    }

    createConnection(dbConfig)
        .then((conn: Connection) => {
            console.info("[LOG] Connected to database");

            const server = createServer(conn, jwtSecretKey);

            server.start(apiPort, () => {
                console.info(`[LOG] Server started on port ${apiPort}`);
            });
        });
}

function createServer(conn: Connection, jwtSecretKey: string): Server {
    // Create Repositories
    const calendarRepository = new CalendarRepository(conn);
    const eventRepository = new EventRepository(conn);
    const pendingUserRepository = new PendingUserRepository(conn);
    const userRepository = new UserRepository(conn);

    // Create Policies
    const calendarPolicy = new CalendarPolicy();

    // Create Validators
    const emailValidator = new EmailValidator();
    const nameValidator = new NameValidator();
    const passwordValidator = new PasswordValidator();

    // Create Services
    const jwtService = new JwtService(jwtSecretKey);
    const passwordService = new PasswordService();

    // Create Views
    const calendarView = new CalendarView();
    const eventView = new EventView();
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
    const calendarController = new CalendarController(
        calendarRepository,
        calendarPolicy,
        calendarView
    );
    const eventController = new EventController(
        eventRepository,
        eventView
    );
    const userController = new UserController(
        userRepository,
        userView,
        emailValidator,
        nameValidator
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
        calendarController,
        eventController,
        userController,

        // Middleware
        authenticatedOnlyMiddleware
    );

    return new Server(router);
}


// Run only if executed directly (e.g: `ts-node sources/main.ts`)
if (require.main === module) {
    main();
}
