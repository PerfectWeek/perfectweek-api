import { Router } from "express";
import Multer from "multer";

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
import { ExpoController } from "./controllers/ExpoController";
import { FriendController } from "./controllers/FriendController";
import { GoogleOauthController } from "./controllers/GoogleOauthController";
import { SearchController } from "./controllers/SearchController";
import { UserController } from "./controllers/UserController";
import { UserImageController } from "./controllers/UserImageController";

import { AuthenticatedOnlyMiddleware } from "./middleware/authenticatedOnlyMiddleware";
import { asyncHandler } from "./middleware/utils/asyncHandler";

export function createRouter(
    // Controllers
    apiEndpointController: ApiEndpointController,
    assistantController: AssistantController,
    authLocalController: AuthLocalController,
    calendarController: CalendarController,
    calendarEventController: CalendarEventController,
    calendarImageController: CalendarImageController,
    calendarMemberController: CalendarMemberController,
    eventController: EventController,
    eventImageController: EventImageController,
    eventRelationshipController: EventRelationshipController,
    expoController: ExpoController,
    friendController: FriendController,
    googleOauthController: GoogleOauthController,
    searchController: SearchController,
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
    // Auth (google)
    //
    router.get(
        "/auth/google/url",
        googleOauthController.getOauthUri,
    );
    router.post(
        "/auth/google/callback",
        asyncHandler(googleOauthController.callback),
    );

    //
    // Users
    //
    router.get(
        "/users/me",
        asyncHandler(authenticatedOnlyMiddleware),
        userController.getSelfUser,
    );
    router.put(
        "/users/me",
        asyncHandler(authenticatedOnlyMiddleware),
        asyncHandler(userController.updateSelfUser),
    );
    router.delete(
        "/users/me",
        asyncHandler(authenticatedOnlyMiddleware),
        asyncHandler(userController.deleteSelfUser),
    );
    router.put(
        "/users/me/timezone",
        asyncHandler(authenticatedOnlyMiddleware),
        asyncHandler(userController.updateSelfUserTimezone),
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
    // Other Users (not self)
    //
    router.get(
        "/users/:userId",
        asyncHandler(authenticatedOnlyMiddleware),
        asyncHandler(userController.getUser),
    );

    //
    // Friend relationships
    //
    router.post(
        "/friends/:userId",
        asyncHandler(authenticatedOnlyMiddleware),
        asyncHandler(friendController.inviteUser),
    );
    router.post(
        "/friends/:userId/accept",
        asyncHandler(authenticatedOnlyMiddleware),
        asyncHandler(friendController.inviteAccept),
    );
    router.post(
        "/friends/:userId/decline",
        asyncHandler(authenticatedOnlyMiddleware),
        asyncHandler(friendController.inviteDecline),
    );
    router.get(
        "/friends",
        asyncHandler(authenticatedOnlyMiddleware),
        asyncHandler(friendController.getAllFriends),
    );
    router.delete(
        "/friends/:userId",
        asyncHandler(authenticatedOnlyMiddleware),
        asyncHandler(friendController.deleteFriend),
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
    router.put(
        "/calendars/:calendarId/images/icon",
        asyncHandler(authenticatedOnlyMiddleware),
        imageUploadMiddleware.single("image"),
        asyncHandler(calendarImageController.uploadImage),
    );
    router.get(
        "/calendars/:calendarId/images/icon",
        // asyncHandler(authenticatedOnlyMiddleware),
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
        asyncHandler(calendarMemberController.acceptMemberInvite),
    );
    router.post(
        "/calendars/:calendarId/member-invite/decline",
        asyncHandler(authenticatedOnlyMiddleware),
        asyncHandler(calendarMemberController.declineMemberInvite),
    );
    router.put(
        "/calendars/:calendarId/members/:userId/role",
        asyncHandler(authenticatedOnlyMiddleware),
        asyncHandler(calendarMemberController.editMemberRole),
    );
    router.delete(
        "/calendars/:calendarId/members/:userId",
        asyncHandler(authenticatedOnlyMiddleware),
        asyncHandler(calendarMemberController.deleteMember),
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
        // asyncHandler(authenticatedOnlyMiddleware),
        asyncHandler(eventImageController.getImage),
    );

    //
    // Assistant
    //
    router.get(
        "/assistant/find-best-slots/:calendarId",
        asyncHandler(authenticatedOnlyMiddleware),
        asyncHandler(assistantController.findBestSlots),
    );
    router.get(
        "/assistant/event-suggestions",
        asyncHandler(authenticatedOnlyMiddleware),
        asyncHandler(assistantController.eventSuggestion),
    );
    router.get(
        "/assistant/perfect-week",
        asyncHandler(authenticatedOnlyMiddleware),
        asyncHandler(assistantController.perfectWeek),
    );

    //
    // Search (User)
    //
    router.get(
        "/search/users",
        asyncHandler(authenticatedOnlyMiddleware),
        asyncHandler(searchController.searchUsers),
    );

    //
    // Expo
    //
    router.post(
        "/expo/token",
        asyncHandler(authenticatedOnlyMiddleware),
        asyncHandler(expoController.registerToken),
    );

    return router;
}
