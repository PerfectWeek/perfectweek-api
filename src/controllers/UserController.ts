import { Request, Response } from "express";

import { getRequestingUser } from "../middleware/utils/getRequestingUser";

import UserView from "../views/UserView";


class UserController {

    private readonly userView: UserView;

    constructor(userView: UserView) {
        this.userView = userView;
    }

    public readonly getMyInfo = (req: Request, res: Response) => {
        const requestingUser = getRequestingUser(req);

        res.status(200).json({
            message: "OK",
            user: this.userView.formatPrivateUser(requestingUser)
        });
    };
}


export default UserController;
