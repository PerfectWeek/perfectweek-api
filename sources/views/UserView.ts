import { User } from "../models/entities/User";
import {UserFriendshipStatus} from "../models/UserRepository";

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

    public readonly formatFriendship = (friend: UserFriendshipStatus): any => {
        return {
            user: this.formatPublicUser(friend.user),
            confirmed: friend.confirmed,
        };
    }
}
