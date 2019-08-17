import { Connection } from "typeorm";

import { PendingUser } from "./entities/PendingUser";

export class PendingUserRepository {

    private readonly conn: Connection;

    constructor(conn: Connection) {
        this.conn = conn;
    }

    public readonly createPendingUser = async (user: PendingUser): Promise<PendingUser> => {
        return this.conn
            .getRepository(PendingUser)
            .save(user);
    }

    public readonly getPendingUserByEmail = async (email: string): Promise<PendingUser | undefined> => {
        return this.conn
            .getRepository(PendingUser)
            .findOne({ where: { email: email } });
    }

    public readonly getPendingUserByUuid = async (uuid: string): Promise<PendingUser | undefined> => {
        return this.conn
            .getRepository(PendingUser)
            .findOne({ where: { uuid: uuid } });
    }

    public readonly deletePendingUserById = async (id: number): Promise<void> => {
        this.conn
            .getRepository(PendingUser)
            .delete(id);
    }
}
