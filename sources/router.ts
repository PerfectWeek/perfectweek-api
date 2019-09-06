import { Router } from "express";
import Multer from "multer";

import { ApiEndpointController } from "./controllers/ApiEndpointController";
import { AuthLocalController } from "./controllers/AuthLocalController";
import { CalendarController } from "./controllers/CalendarController";
import { CalendarEventController } from "./controllers/CalendarEventController";
import { CalendarImageController } from "./controllers/CalendarImageController";
import { EventController } from "./controllers/EventController";
import { EventImageController } from "./controllers/EventImageController";
import { UserController } from "./controllers/UserController";
import { UserImageController } from "./controllers/UserImageController";

import { AuthenticatedOnlyMiddleware } from "./middleware/authenticatedOnlyMiddleware";
import { asyncHandler } from "./middleware/utils/asyncHandler";

export function createRouter(
    // Controllers
    apiEndpointController: ApiEndpointController,
    authLocalController: AuthLocalController,
    calendarController: CalendarController,
    calendarEventController: CalendarEventController,
    calendarImageController: CalendarImageController,
    eventController: EventController,
    eventImageController: EventImageController,
    userController: UserController,
    userImageController: UserImageController,
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
    router.get(
        "/favicon.ico",
        apiEndpointController.favicon,
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
        userController.getUser,
    );
    router.put(
        "/users/me",
        asyncHandler(authenticatedOnlyMiddleware),
        asyncHandler(userController.updateUser),
    );
    router.delete(
        "/users/me",
        asyncHandler(authenticatedOnlyMiddleware),
        asyncHandler(userController.deleteUser),
    );
    router.put(
        "/users/me/timezone",
        asyncHandler(authenticatedOnlyMiddleware),
        asyncHandler(userController.updateUserTimezone),
    );

    //
    // Users image
    //
    router.put(
        "/users/me/images/profile",
        asyncHandler(authenticatedOnlyMiddleware),
        imageUploadMiddleware.single("image"),
        userImageController.uploadImage,
    );
    router.get(
        "/users/:userId/images/profile",
        asyncHandler(userImageController.getImage),
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
        asyncHandler(calendarController.getAllCalendars),
    );
    router.get(
        "/calendars/:calendarId",
        asyncHandler(authenticatedOnlyMiddleware),
        asyncHandler(calendarController.getCalendar),
    );
    router.put(
        "/calendars/:calendarId",
        asyncHandler(authenticatedOnlyMiddleware),
        asyncHandler(calendarController.editCalendar),
    );
    router.delete(
        "/calendars/:calendarId",
        asyncHandler(authenticatedOnlyMiddleware),
        asyncHandler(calendarController.deleteCalendar),
    );

    // Calendar event
    router.post(
        "/calendars/:calendarId/events",
        asyncHandler(authenticatedOnlyMiddleware),
        asyncHandler(calendarEventController.addEventToCalendar),
    );
    router.delete(
        "/calendars/:calendarId/events/:eventId",
        asyncHandler(authenticatedOnlyMiddleware),
        asyncHandler(calendarEventController.removeEventFromCalendar),
    );

    //
    // Calendar image
    //
    router.get(
        "/calendars/:calendarId/images/icon",
        asyncHandler(authenticatedOnlyMiddleware),
        asyncHandler(calendarImageController.uploadImage),
    );
    router.put(
        "/calendars/:calendarId/images/icon",
        asyncHandler(authenticatedOnlyMiddleware),
        imageUploadMiddleware.single("image"),
        asyncHandler(calendarImageController.getImage),
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
        asyncHandler(eventController.getEvent),
    );
    router.put(
        "/events/:eventId",
        asyncHandler(authenticatedOnlyMiddleware),
        asyncHandler(eventController.updateEvent),
    );
    router.delete(
        "/events/:eventId",
        asyncHandler(authenticatedOnlyMiddleware),
        asyncHandler(eventController.deleteEvent),
    );

    //
    // Event image
    //
    router.put(
        "/events/:eventId/images/icon",
        asyncHandler(authenticatedOnlyMiddleware),
        imageUploadMiddleware.single("image"),
        asyncHandler(eventImageController.uploadImage),
    );
    router.get(
        "/events/:eventId/images/icon",
        asyncHandler(authenticatedOnlyMiddleware),
        asyncHandler(eventImageController.getImage),
    );

    return router;
}
