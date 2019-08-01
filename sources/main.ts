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

import DateService from "./services/DateService";
import ImageStorageService from "./services/ImageStorageService";
import JwtService from "./services/JwtService";
import PasswordService from "./services/PasswordService";

import EmailValidator from "./validators/EmailValidator";
import NameValidator from "./validators/NameValidator";
import PasswordValidator from "./validators/PasswordValidator";

import CalendarPolicy from "./policies/CalendarPolicy";
import EventPolicy from "./policies/EventPolicy";

import ApiEndpointController from "./controllers/ApiEndpointController";
import AuthLocalController from "./controllers/AuthLocalController";
import CalendarController from "./controllers/CalendarController";
import EventController from "./controllers/EventController";
import UserController from "./controllers/UserController";

import * as AuthenticatedOnlyMiddleware from "./middleware/authenticatedOnlyMiddleware";
import * as ImageUploadMiddleware from "./middleware/imageUploadMiddleware";


function main(): void {
    const dbConfig = DbConfig.load("../ormconfig.js");

    const apiPort = parseInt(process.env.PORT || "", 10);
    if (isNaN(apiPort)) {
        throw new Error('Missing environment variable "PORT"');
    }

    const jwtSecretKey = process.env.JWT_SECRET_KEY;
    if (!jwtSecretKey) {
        throw new Error('Missing environment variable "JWT_SECRET_KEY"');
    }

    const ASSETS_INFO: AssetsInfo = {
        assetVolumeRoot: "/assets",
        userProfileImageDefault: "/app/sources/assets/images/user_profile_default.jpg"
    };

    createConnection(dbConfig)
        .then((conn: Connection) => {
            console.info("[LOG] Connected to database");

            const server = createServer(conn, jwtSecretKey, ASSETS_INFO);

            server.start(apiPort, () => {
                console.info(`[LOG] Server started on port ${apiPort}`);
            });
        });
}

function createServer(conn: Connection, jwtSecretKey: string, assetsInfo: AssetsInfo): Server {
    // Create Repositories
    const calendarRepository = new CalendarRepository(conn);
    const eventRepository = new EventRepository(conn);
    const pendingUserRepository = new PendingUserRepository(conn);
    const userRepository = new UserRepository(conn);

    // Create Policies
    const calendarPolicy = new CalendarPolicy();
    const eventPolicy = new EventPolicy();

    // Create Validators
    const emailValidator = new EmailValidator();
    const nameValidator = new NameValidator();
    const passwordValidator = new PasswordValidator();

    // Create Services
    const dateService = new DateService();
    const jwtService = new JwtService(jwtSecretKey);
    const passwordService = new PasswordService();
    const userProfileImageStorageService = new ImageStorageService(
        `${assetsInfo.assetVolumeRoot}/images/users/profile`
    );

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
        eventRepository,
        calendarPolicy,
        eventPolicy,
        calendarView
    );
    const eventController = new EventController(
        calendarRepository,
        eventRepository,
        calendarPolicy,
        eventPolicy,
        dateService,
        eventView
    );
    const userController = new UserController(
        userRepository,
        userProfileImageStorageService,
        userView,
        emailValidator,
        nameValidator,
        assetsInfo.userProfileImageDefault
    );

    // Create middlewares
    const authenticatedOnlyMiddleware = AuthenticatedOnlyMiddleware.generateAuthenticatedOnlyMiddleware(
        userRepository,
        jwtService
    );
    const imageUploadMiddleware = ImageUploadMiddleware.generateImageUploadMiddleware("/assets/uploads/images");

    // Create Router
    const router = Router.createRouter(
        // Controller
        apiEndpointController,
        authLocalController,
        calendarController,
        eventController,
        userController,

        // Middleware
        authenticatedOnlyMiddleware,
        imageUploadMiddleware
    );

    return new Server(router);
}

type AssetsInfo = {
    assetVolumeRoot: string,

    userProfileImageDefault: string
};


// Run only if executed directly (e.g: `ts-node sources/main.ts`)
if (require.main === module) {
    main();
}
