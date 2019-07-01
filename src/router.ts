import { Router } from "express";

import ApiEndpointController from "./controllers/ApiEndpointController";
import AuthLocalController from "./controllers/AuthLocalController";
import UserController from "./controllers/UserController";

import { AuthenticatedOnlyMiddleware } from "./middleware/authenticatedOnlyMiddleware";
import asyncHandler from "./middleware/utils/asyncHandler";


export function createRouter(
    // Controllers
    apiEndpointController: ApiEndpointController,
    authLocalController: AuthLocalController,
    userController: UserController,

    // Middleware
    authenticatedOnly: AuthenticatedOnlyMiddleware
): Router {
    const router = Router();

    router.get("/", apiEndpointController.endpoint);

    router.post("/auth/local/register", asyncHandler(authLocalController.registerUser));
    router.post("/auth/local/login", asyncHandler(authLocalController.loginUser));
    router.get("/auth/local/validate-email/:uuid", asyncHandler(authLocalController.validateEmail));

    router.get("/users/me", asyncHandler(authenticatedOnly), userController.getMyInfo);

    return router;
}
