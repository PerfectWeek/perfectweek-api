import { Router } from "express";
import Multer from "multer";

import ApiEndpointController from "./controllers/ApiEndpointController";
import AuthLocalController from "./controllers/AuthLocalController";
import CalendarController from "./controllers/CalendarController";
import EventController from "./controllers/EventController";
import UserController from "./controllers/UserController";

import { AuthenticatedOnlyMiddleware } from "./middleware/authenticatedOnlyMiddleware";
import { asyncHandler } from "./middleware/utils/asyncHandler";


export function createRouter(
    // Controllers
    apiEndpointController: ApiEndpointController,
    authLocalController: AuthLocalController,
    calendarController: CalendarController,
    eventController: EventController,
    userController: UserController,

    // Middleware
    authenticatedOnlyMiddleware: AuthenticatedOnlyMiddleware,
    imageUploadMiddleware: Multer.Instance
): Router {
    const router = Router();

    router.get(
        "/",
        apiEndpointController.endpoint
    );

    router.post(
        "/auth/local/register",
        asyncHandler(authLocalController.registerUser)
    );
    router.post(
        "/auth/local/login",
        asyncHandler(authLocalController.authenticateUser)
    );
    router.get(
        "/auth/local/validate-email/:uuid",
        asyncHandler(authLocalController.validateEmail)
    );

    router.get(
        "/users/me",
        asyncHandler(authenticatedOnlyMiddleware),
        userController.getMyInfo
    );
    router.put(
        "/users/me",
        asyncHandler(authenticatedOnlyMiddleware),
        asyncHandler(userController.updateMyInfo)
    );
    router.delete(
        "/users/me",
        asyncHandler(authenticatedOnlyMiddleware),
        asyncHandler(userController.deleteUser)
    );
    router.put(
        "/users/me/images/profile",
        asyncHandler(authenticatedOnlyMiddleware),
        imageUploadMiddleware.single("image"),
        userController.uploadImage
    );
    router.get(
        "/users/me/images/profile",
        asyncHandler(authenticatedOnlyMiddleware),
        userController.getMyImage
    );
    router.get(
        "/users/:userId/images/profile",
        asyncHandler(userController.getUserImage)
    );
    router.put(
        "/users/me/timezone",
        asyncHandler(authenticatedOnlyMiddleware),
        asyncHandler(userController.updateTimezone)
    );

    router.post(
        "/calendars",
        asyncHandler(authenticatedOnlyMiddleware),
        asyncHandler(calendarController.createCalendar)
    );
    router.get(
        "/calendars",
        asyncHandler(authenticatedOnlyMiddleware),
        asyncHandler(calendarController.getAllCalendarsOfRequestingUser)
    );
    router.get(
        "/calendars/:calendarId",
        asyncHandler(authenticatedOnlyMiddleware),
        asyncHandler(calendarController.getCalendarInfo)
    );
    router.put(
        "/calendars/:calendarId",
        asyncHandler(authenticatedOnlyMiddleware),
        asyncHandler(calendarController.editCalendarInfo)
    );
    router.delete(
        "/calendars/:calendarId",
        asyncHandler(authenticatedOnlyMiddleware),
        asyncHandler(calendarController.deleteCalendar)
    );
    router.post(
        "/calendars/:calendarId/events",
        asyncHandler(authenticatedOnlyMiddleware),
        asyncHandler(calendarController.addEventToCalendar)
    );
    router.delete(
        "/calendars/:calendarId/events/:eventId",
        asyncHandler(authenticatedOnlyMiddleware),
        asyncHandler(calendarController.removeEventFromCalendar)
    );

    router.post(
        "/events",
        asyncHandler(authenticatedOnlyMiddleware),
        asyncHandler(eventController.createEvent)
    );
    router.get(
        "/events",
        asyncHandler(authenticatedOnlyMiddleware),
        asyncHandler(eventController.getAllEvents)
    );
    router.get(
        "/events/:eventId",
        asyncHandler(authenticatedOnlyMiddleware),
        asyncHandler(eventController.getEventInfo)
    )

    return router;
}
