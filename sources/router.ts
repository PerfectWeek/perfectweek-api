import { Router } from "express";
import Multer from "multer";

import { ApiEndpointController } from "./controllers/ApiEndpointController";
import { AuthLocalController } from "./controllers/AuthLocalController";
import { CalendarController } from "./controllers/CalendarController";
import { CalendarEventController } from "./controllers/CalendarEventController";
import { CalendarImageController } from "./controllers/CalendarImageController";
import { CalendarMemberController } from "./controllers/CalendarMemberController";
import { EventController } from "./controllers/EventController";
import { EventImageController } from "./controllers/EventImageController";
import { EventRelationshipController } from "./controllers/EventRelationshipController";
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
    calendarMemberController: CalendarMemberController,
    eventController: EventController,
    eventImageController: EventImageController,
    eventRelationshipController: EventRelationshipController,
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
        asyncHandler(calendarController.updateCalendar),
    );
    router.delete(
        "/calendars/:calendarId",
        asyncHandler(authenticatedOnlyMiddleware),
        asyncHandler(calendarController.deleteCalendar),
    );

    //
    // Calendar events
    //
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
    // Calendar members
    //
    router.post(
        "/calendars/:calendarId/members",
        asyncHandler(authenticatedOnlyMiddleware),
        asyncHandler(calendarMemberController.inviteMembers),
    );
    router.post(
        "/calendars/:calendarId/member-invite/accept",
        asyncHandler(authenticatedOnlyMiddleware),
        asyncHandler(calendarMemberController.acceptInvite),
    );
    router.post(
        "/calendars/:calendarId/member-invite/decline",
        asyncHandler(authenticatedOnlyMiddleware),
        asyncHandler(calendarMemberController.declineInvite),
    );
    // TODO: DELETE "/calendars/:calendarId/members/:userId"

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
    // Event attendees
    //
    router.post(
        "/events/:eventId/attendees",
        asyncHandler(authenticatedOnlyMiddleware),
        asyncHandler(eventRelationshipController.inviteAttendees),
    );
    router.put(
        "/events/:eventId/attendees/me/status",
        asyncHandler(authenticatedOnlyMiddleware),
        asyncHandler(eventRelationshipController.updateSelfStatus),
    );
    router.put(
        "/events/:eventId/attendees/:userId/role",
        asyncHandler(authenticatedOnlyMiddleware),
        asyncHandler(eventRelationshipController.updateAttendeeRole),
    );
    // TODO: DELETE /events/:eventId/attendees/:attendeeId

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
