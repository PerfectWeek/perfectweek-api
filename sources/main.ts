import "reflect-metadata";
import { Connection, createConnection } from "typeorm";

import * as DbConfig from "./dbConfig";
import * as Router from "./router";

import { Server } from "./Server";

import { CalendarView } from "./views/CalendarView";
import { EventSuggestionView } from "./views/EventSuggestionView";
import { EventView } from "./views/EventView";
import { TimeSlotView } from "./views/TimeSlotView";
import { UserView } from "./views/UserView";

import { CalendarRepository } from "./models/CalendarRepository";
import { EventRepository } from "./models/EventRepository";
import { PendingUserRepository } from "./models/PendingUserRepository";
import { UserRepository } from "./models/UserRepository";

import { AssistantEventSuggestionService } from "./services/assistant/AssistantEventSuggestionService";
import { AssistantSlotService } from "./services/assistant/AssistantSlotService";
import { DateService } from "./services/DateService";
import { GoogleApiService } from "./services/googleapi/GoogleApiService";
import { ImageStorageService } from "./services/ImageStorageService";
import { JwtService } from "./services/JwtService";
import { createMailService } from "./services/MailService";
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
import { GoogleOauthController } from "./controllers/GoogleOauthController";
import { SearchController } from "./controllers/SearchController";
import { UserController } from "./controllers/UserController";
import { UserImageController } from "./controllers/UserImageController";

import { Config, loadConfig } from "./config";

import * as AuthenticatedOnlyMiddleware from "./middleware/authenticatedOnlyMiddleware";
import * as ImageUploadMiddleware from "./middleware/imageUploadMiddleware";

const CURRENT_DIRECTORY: string = __dirname;

function main(): void {
    const config = loadConfig();
    const dbConfig = DbConfig.load("../ormconfig.js");

    createConnection(dbConfig).then((conn: Connection) => {
        console.info("[LOG] Connected to database");

        const server = createServer(conn, config);

        server.start(config.API_PORT, () => {
            console.info(`[LOG] Server started on port ${config.API_PORT}`);
        });
    });
}

function createServer(
    conn: Connection,
    config: Config,
): Server {
    // Assets info
    const assetsInfo = buildAssetsInfo(config.ASSETS_ROOT_DIR);

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
    const assistantEventSuggestionService = new AssistantEventSuggestionService();
    const assistantSlotService = new AssistantSlotService();
    const dateService = new DateService();
    const googleApiService = new GoogleApiService(
        eventRepository,
        userRepository,
        calendarRepository,
        {
            clientId: config.GOOGLE_CLIENT_ID,
            clientSecret: config.GOOGLE_SECRET_ID,
            redirectUri: `${config.FRONT_END_HOST}/login/google-callback`,
            scopes: "email profile openid https://www.googleapis.com/auth/calendar.readonly",
        },
    );
    const jwtService = new JwtService(config.JWT_SECRET_KEY);
    const mailService = config.EMAIL_ENABLED
        ? createMailService(config.MAILGUN_API_KEY!, config.MAILGUN_DOMAIN!, config.EMAIL_FROM)
        : undefined;
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
    const eventSuggestionView = new EventSuggestionView(eventView);
    const timeSlotView = new TimeSlotView();
    const userView = new UserView();

    // Create Controllers
    const apiEndpointController = new ApiEndpointController(
        assetsInfo.favicon.image,
    );
    const assistantController = new AssistantController(
        calendarRepository,
        eventRepository,
        assistantEventSuggestionService,
        assistantSlotService,
        dateService,
        eventSuggestionView,
        timeSlotView,
    );
    const authLocalController = new AuthLocalController(
        pendingUserRepository,
        userRepository,
        jwtService,
        mailService,
        passwordService,
        emailValidator,
        nameValidator,
        passwordValidator,
        `${config.FRONT_END_HOST}/auth/validate-email`,
    );
    const calendarController = new CalendarController(
        calendarRepository,
        googleApiService,
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
    const friendController = new FriendController(
        userRepository,
        userView,
    );
    const googleOauthController = new GoogleOauthController(
        userRepository,
        googleApiService,
        jwtService,
    );
    const searchController = new SearchController(
        userRepository,
    );
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
        googleOauthController,
        searchController,
        userController,
        userImageController,
        // Middleware
        authenticatedOnlyMiddleware,
        imageUploadMiddleware,
    );

    return new Server(router, {
        devMode: config.NODE_ENV === "development",
    });
}

function buildAssetsInfo(assetsRootDir: string) {
    return {
        favicon: {
            image: `${CURRENT_DIRECTORY}/assets/favicon.ico`,
        },
        MULTER_UPLOAD_DIR: `${assetsRootDir}/uploads/images`,
        calendars: {
            icon: {
                baseDir: `${assetsRootDir}/images/calendars/icon`,
                default: `${CURRENT_DIRECTORY}/assets/images/calendar_icon_default.jpg`,
            },
        },
        events: {
            image: {
                baseDir: `${assetsRootDir}/images/events/image`,
                default: `${CURRENT_DIRECTORY}/assets/images/event_image_default.jpg`,
            },
        },
        users: {
            profile: {
                baseDir: `${assetsRootDir}/images/users/profile`,
                default: `${CURRENT_DIRECTORY}/assets/images/user_profile_default.jpg`,
            },
        },

    };
}

// Run only if executed directly (e.g: `ts-node sources/main.ts`)
if (require.main === module) {
    main();
}
