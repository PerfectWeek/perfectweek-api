import { Connection } from "typeorm";

import User from "./entities/User";


class UserRepository {

    private readonly conn: Connection;

    constructor(conn: Connection) {
        this.conn = conn;
    }

    public readonly createUser = async (user: User): Promise<User> => {
        return this.conn
            .getRepository(User)
            .save(user);
    };

    public readonly getUserByEmail = async (email: string): Promise<User | undefined> => {
        return this.conn
            .getRepository(User)
            .findOne({ where: { email: email } });
    };

    public readonly getUserById = async (id: number): Promise<User | undefined> => {
        return this.conn
            .getRepository(User)
            .findOne({ where: { id: id } });
    };
}


export default UserRepository;
