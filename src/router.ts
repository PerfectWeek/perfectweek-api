import { Router } from "express";

import ApiEndpointController from "./controllers/ApiEndpointController";
import AuthLocalController from "./controllers/AuthLocalController";
import CalendarController from "./controllers/CalendarController";
import UserController from "./controllers/UserController";

import { AuthenticatedOnlyMiddleware } from "./middleware/authenticatedOnlyMiddleware";
import { asyncHandler } from "./middleware/utils/asyncHandler";


export function createRouter(
    // Controllers
    apiEndpointController: ApiEndpointController,
    authLocalController: AuthLocalController,
    calendarController: CalendarController,
    userController: UserController,

    // Middleware
    authenticatedOnlyMiddleware: AuthenticatedOnlyMiddleware
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
    router.get(
        "/calendars/:calendarId/members",
        asyncHandler(authenticatedOnlyMiddleware),
        asyncHandler(calendarController.getCalendarMembers)
    );

    return router;
}
