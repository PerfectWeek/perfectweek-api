import { Router } from "express";

import ApiEndpointController from "./controllers/ApiEndpointController";
import AuthLocalController from "./controllers/AuthLocalController";
import CalendarController from "./controllers/CalendarController";
import UserController from "./controllers/UserController";

import { AuthenticatedOnlyMiddleware } from "./middleware/authenticatedOnlyMiddleware";
import asyncHandler from "./middleware/utils/asyncHandler";


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
    router.put(
        "/users/me/timezone",
        asyncHandler(authenticatedOnlyMiddleware),
        asyncHandler(userController.updateTimezone)
    );

    router.get(
        "/calendars",
        asyncHandler(authenticatedOnlyMiddleware),
        asyncHandler(calendarController.getAllCalendarsOfRequestingUser)
    );

    return router;
}
