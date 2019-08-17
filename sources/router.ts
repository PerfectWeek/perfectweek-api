import { Router } from "express";
import Multer from "multer";

import { ApiEndpointController } from "./controllers/ApiEndpointController";
import { AuthLocalController } from "./controllers/AuthLocalController";
import { CalendarController } from "./controllers/CalendarController";
import { EventController } from "./controllers/EventController";
import { UserController } from "./controllers/UserController";

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
    imageUploadMiddleware: Multer.Instance,
): Router {
    const router = Router();

    //
    // Endpoint
    //
    router.get(
        "/",
        apiEndpointController.endpoint,
    );

    //
    // Auth (local)
    //
    router.post(
        "/auth/local/register",
        asyncHandler(authLocalController.registerUser),
    );
    router.post(
        "/auth/local/login",
        asyncHandler(authLocalController.authenticateUser),
    );
    router.get(
        "/auth/local/validate-email/:uuid",
        asyncHandler(authLocalController.validateEmail),
    );

    //
    // Users
    //
    router.get(
        "/users/me",
        asyncHandler(authenticatedOnlyMiddleware),
        userController.getMyInfo,
    );
    router.put(
        "/users/me",
        asyncHandler(authenticatedOnlyMiddleware),
        asyncHandler(userController.updateMyInfo),
    );
    router.delete(
        "/users/me",
        asyncHandler(authenticatedOnlyMiddleware),
        asyncHandler(userController.deleteUser),
    );
    router.put(
        "/users/me/images/profile",
        asyncHandler(authenticatedOnlyMiddleware),
        imageUploadMiddleware.single("image"),
        userController.uploadImage,
    );
    router.put(
        "/users/me/timezone",
        asyncHandler(authenticatedOnlyMiddleware),
        asyncHandler(userController.updateTimezone),
    );
    router.get(
        "/users/:userId/images/profile",
        asyncHandler(userController.getUserImage),
    );

    //
    // Calendars
    //
    router.post(
        "/calendars",
        asyncHandler(authenticatedOnlyMiddleware),
        asyncHandler(calendarController.createCalendar),
    );
    router.get(
        "/calendars",
        asyncHandler(authenticatedOnlyMiddleware),
        asyncHandler(calendarController.getAllCalendarsOfRequestingUser),
    );
    router.get(
        "/calendars/:calendarId",
        asyncHandler(authenticatedOnlyMiddleware),
        asyncHandler(calendarController.getCalendarInfo),
    );
    router.put(
        "/calendars/:calendarId",
        asyncHandler(authenticatedOnlyMiddleware),
        asyncHandler(calendarController.editCalendarInfo),
    );
    router.delete(
        "/calendars/:calendarId",
        asyncHandler(authenticatedOnlyMiddleware),
        asyncHandler(calendarController.deleteCalendar),
    );
    router.put(
        "/calendars/:calendarId/images/icon",
        asyncHandler(authenticatedOnlyMiddleware),
        imageUploadMiddleware.single("image"),
        asyncHandler(calendarController.uploadImage),
    );
    router.get(
        "/calendars/:calendarId/images/icon",
        asyncHandler(authenticatedOnlyMiddleware),
        asyncHandler(calendarController.getImage),
    );
    router.post(
        "/calendars/:calendarId/events",
        asyncHandler(authenticatedOnlyMiddleware),
        asyncHandler(calendarController.addEventToCalendar),
    );
    router.delete(
        "/calendars/:calendarId/events/:eventId",
        asyncHandler(authenticatedOnlyMiddleware),
        asyncHandler(calendarController.removeEventFromCalendar),
    );

    //
    // Events
    //
    router.post(
        "/events",
        asyncHandler(authenticatedOnlyMiddleware),
        asyncHandler(eventController.createEvent),
    );
    router.get(
        "/events",
        asyncHandler(authenticatedOnlyMiddleware),
        asyncHandler(eventController.getAllEvents),
    );
    router.get(
        "/events/:eventId",
        asyncHandler(authenticatedOnlyMiddleware),
        asyncHandler(eventController.getEventInfo),
    );
    router.put(
        "/events/:eventId/images/icon",
        asyncHandler(authenticatedOnlyMiddleware),
        imageUploadMiddleware.single("image"),
        asyncHandler(eventController.uploadImage),
    );
    router.get(
        "/events/:eventId/images/icon",
        asyncHandler(authenticatedOnlyMiddleware),
        asyncHandler(eventController.getImage),
    );

    return router;
}
