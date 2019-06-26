import { Router } from "express";

import ApiEndpointController from "./controllers/ApiEndpointController";


export function createRouter(
    // Controllers
    apiEndpointController: ApiEndpointController
): Router {
    const router = Router();

    router.get("/", apiEndpointController.endpoint);

    return router;
}
