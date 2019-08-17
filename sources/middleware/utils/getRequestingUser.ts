import { Request } from "express";

import { User } from "../../models/entities/User";

export function getRequestingUser(req: Request): User {
    return (<any> req).user;
}
