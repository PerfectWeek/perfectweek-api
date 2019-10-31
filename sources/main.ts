import "reflect-metadata";
import { Connection, createConnection } from "typeorm";

import * as DbConfig from "./dbConfig";
import * as Router from "./router";

import { Server } from "./Server";

import { CalendarView } from "./views/CalendarView";
import { EventView } from "./views/EventView";
import { TimeSlotView } from './views/TimeSlotView';
import { UserView } from "./views/UserView";

import { CalendarRepository } from "./models/CalendarRepository";
import { EventRepository } from "./models/EventRepository";
import { PendingUserRepository } from "./models/PendingUserRepository";
import { UserRepository } from "./models/UserRepository";

import { AssistantSlotService } from './services/AssistantSlotService';
import { DateService } from "./services/DateService";
import { ImageStorageService } from "./services/ImageStorageService";
import { JwtService } from "./services/JwtService";
import { PasswordService } from "./services/PasswordService";

import { EmailValidator } from "./validators/EmailValidator";
import { NameValidator } from "./validators/NameValidator";
import { PasswordValidator } from "./validators/PasswordValidator";

import { CalendarPolicy } from "./policies/CalendarPolicy";
import { EventPolicy } from "./policies/EventPolicy";

import { ApiEndpointController } from "./controllers/ApiEndpointController";
import { AssistantController } from "./controllers/AssistantController";
import { AuthLocalController } from "./controllers/AuthLocalController";
import { CalendarController } from "./controllers/CalendarController";
import { CalendarEventController } from "./controllers/CalendarEventController";
import { CalendarImageController } from "./controllers/CalendarImageController";
import { CalendarMemberController } from "./controllers/CalendarMemberController";
import { EventController } from "./controllers/EventController";
import { EventImageController } from "./controllers/EventImageController";
import { EventRelationshipController } from "./controllers/EventRelationshipController";
import { FriendController } from "./controllers/FriendController";
import { UserController } from "./controllers/UserController";
import { UserImageController } from "./controllers/UserImageController";

import * as AuthenticatedOnlyMiddleware from "./middleware/authenticatedOnlyMiddleware";
import * as ImageUploadMiddleware from "./middleware/imageUploadMiddleware";

const CURRENT_DIRECTORY: string = __dirname;

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

    const ASSETS_ROOT_DIR = process.env.ASSETS_ROOT_DIR;
    if (!ASSETS_ROOT_DIR) {
        throw new Error('Missing environment variable "ASSETS_ROOT_DIR"');
    }

    const ASSETS_INFO: AssetsInfo = {
        favicon: {
            image: `${CURRENT_DIRECTORY}/assets/favicon.ico`,
        },
        MULTER_UPLOAD_DIR: `${ASSETS_ROOT_DIR}/uploads/images`,
        calendars: {
            icon: {
                baseDir: `${ASSETS_ROOT_DIR}/images/calendars/icon`,
                default: `${CURRENT_DIRECTORY}/assets/images/calendar_icon_default.jpg`,
            },
        },
        events: {
            image: {
                baseDir: `${ASSETS_ROOT_DIR}/images/events/image`,
                default: `${CURRENT_DIRECTORY}/assets/images/event_image_default.jpg`,
            },
        },
        users: {
            profile: {
                baseDir: `${ASSETS_ROOT_DIR}/images/users/profile`,
                default: `${CURRENT_DIRECTORY}/assets/images/user_profile_default.jpg`,
            },
        },
    };

    createConnection(dbConfig).then((conn: Connection) => {
        console.info("[LOG] Connected to database");

        const server = createServer(conn, jwtSecretKey, ASSETS_INFO);

        server.start(apiPort, () => {
            console.info(`[LOG] Server started on port ${apiPort}`);
        });
    });
}

function createServer(
    conn: Connection,
    jwtSecretKey: string,
    assetsInfo: AssetsInfo,
): Server {
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
    const assistantSlotService = new AssistantSlotService();
    const dateService = new DateService();
    const jwtService = new JwtService(jwtSecretKey);
    const passwordService = new PasswordService();
    const calendarIconImageStorageService = new ImageStorageService(
        assetsInfo.calendars.icon.baseDir,
    );
    const eventImageStorageService = new ImageStorageService(
        assetsInfo.events.image.baseDir,
    );
    const userProfileImageStorageService = new ImageStorageService(
        assetsInfo.users.profile.baseDir,
    );

    // Create Views
    const calendarView = new CalendarView();
    const eventView = new EventView();
    const timeSlotView = new TimeSlotView();
    const userView = new UserView();

    // Create Controllers
    const apiEndpointController = new ApiEndpointController(
        assetsInfo.favicon.image,
    );
    const assistantController = new AssistantController(
        calendarRepository,
        eventRepository,
        assistantSlotService,
        dateService,
        timeSlotView,
    );
    const authLocalController = new AuthLocalController(
        pendingUserRepository,
        userRepository,
        jwtService,
        passwordService,
        emailValidator,
        nameValidator,
        passwordValidator,
    );
    const calendarController = new CalendarController(
        calendarRepository,
        calendarPolicy,
        calendarView,
    );
    const calendarEventController = new CalendarEventController(
        calendarRepository,
        eventRepository,
        calendarPolicy,
        eventPolicy,
    );
    const calendarImageController = new CalendarImageController(
        calendarRepository,
        calendarIconImageStorageService,
        calendarPolicy,
        assetsInfo.calendars.icon.default,
    );
    const calendarMemberController = new CalendarMemberController(
        calendarRepository,
        eventRepository,
        userRepository,
        calendarPolicy,
        calendarView,
    );
    const eventController = new EventController(
        calendarRepository,
        eventRepository,
        calendarPolicy,
        eventPolicy,
        dateService,
        eventView,
    );
    const eventImageController = new EventImageController(
        eventRepository,
        eventImageStorageService,
        eventPolicy,
        assetsInfo.events.image.default,
    );
    const eventRelationshipController = new EventRelationshipController(
        eventRepository,
        userRepository,
        eventPolicy,
        eventView,
    );
    const friendController = new FriendController();
    const userController = new UserController(
        userRepository,
        emailValidator,
        nameValidator,
        userView,
    );
    const userImageController = new UserImageController(
        userRepository,
        userProfileImageStorageService,
        assetsInfo.users.profile.default,
    );

    // Create middlewares
    const authenticatedOnlyMiddleware = AuthenticatedOnlyMiddleware.generateAuthenticatedOnlyMiddleware(
        userRepository,
        jwtService,
    );
    const imageUploadMiddleware = ImageUploadMiddleware.generateImageUploadMiddleware(
        assetsInfo.MULTER_UPLOAD_DIR,
    );

    // Create Router
    const router = Router.createRouter(
        // Controller
        apiEndpointController,
        assistantController,
        authLocalController,
        calendarController,
        calendarEventController,
        calendarImageController,
        calendarMemberController,
        eventController,
        eventImageController,
        eventRelationshipController,
        friendController,
        userController,
        userImageController,
        // Middleware
        authenticatedOnlyMiddleware,
        imageUploadMiddleware,
    );

    return new Server(router);
}

type AssetsInfo = {
    favicon: {
        image: string;
    };
    MULTER_UPLOAD_DIR: string;
    calendars: {
        icon: {
            baseDir: string;
            default: string;
        };
    };
    events: {
        image: {
            baseDir: string;
            default: string;
        };
    };
    users: {
        profile: {
            baseDir: string;
            default: string;
        };
    };
};

// Run only if executed directly (e.g: `ts-node sources/main.ts`)
if (require.main === module) {
    main();
}
