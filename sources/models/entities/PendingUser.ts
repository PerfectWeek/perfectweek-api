import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";


@Entity("pending_users")
class PendingUser {

    @PrimaryGeneratedColumn()
    public id: number;

    @Column()
    @Index({ unique: true })
    public email: string;

    @Column()
    public name: string;

    @Column({ name: "ciphered_password" })
    public cipheredPassword: string;

    @Column()
    @Index({ unique: true })
    public uuid: string;

    constructor(data?: PendingUserData) {
        this.id = 0;
        this.email = data && data.email || "";
        this.name = data && data.name || "";
        this.cipheredPassword = data && data.cipheredPassword || "";
        this.uuid = data && data.uuid || "";
    }
}

type PendingUserData = {
    name: string,
    email: string,
    cipheredPassword: string,
    uuid: string
};


export default PendingUser;
