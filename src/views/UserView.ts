import User from "../models/entities/User";


class UserView {

    public readonly formatPrivateUser = (user: User): any => {
        return {
            id: user.id,
            name: user.name,
            email: user.email
        };
    }

    public readonly formatPublicUser = (user: User): any => {
        return {
            id: user.id,
            name: user.name
        }
    };
}


export default UserView;
