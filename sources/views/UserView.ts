import { User } from "../models/entities/User";
import {UserFriendship} from "../models/entities/UserFriendship";

export class UserView {

    public readonly formatPrivateUser = (user: User): any => {
        return {
            email: user.email,
            id: user.id,
            name: user.name,
        };
    }

    public readonly formatPublicUser = (user: User): any => {
        return {
            id: user.id,
            name: user.name,
        };
    }

    public readonly formatFriendship = (userFriendship: UserFriendship): any => {
        return {
            requestedUser: userFriendship.requestedId,
        };
    }
}
