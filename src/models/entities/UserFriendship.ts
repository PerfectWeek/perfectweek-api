import { Entity, PrimaryColumn, Index, Column } from "typeorm";

import User from "./User";


@Entity("user_frienships")
class UserFriendship {

    @PrimaryColumn({name: "requesting_id"})
    public requestingId: number;

    @PrimaryColumn({name: "requested_id"})
    @Index()
    public requestedId: number;

    @Column()
    public confirmed: boolean;

    public requestingUser?: User;
    public requestedUser?: User;

    constructor(data?: UserFriendshipData) {
        this.requestingId = data && data.requestingId || 0;
        this.requestedId = data && data.requestedId || 0;
        this.confirmed = data ? data.confirmed : true;

        this.requestingUser = undefined;
        this.requestedUser = undefined;
    }
}

type UserFriendshipData = {
    requestingId: number,
    requestedId: number,
    confirmed: boolean
};


export default UserFriendship;
