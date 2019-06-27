import { Request, Response } from "express";

import { getRequestingUser } from "../middlewares/utils/getRequestingUser";


class UserController {

    public readonly getMyInfo = (req: Request, res: Response) => {
        const requestingUser = getRequestingUser(req);

        res.status(200).json({
            message: "OK",
            user: {
                name: requestingUser.name,
                email: requestingUser.email,
                id: requestingUser.id
            }
        });
    };
}


export default UserController;
