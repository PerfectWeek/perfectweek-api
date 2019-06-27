import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";


@Entity("users")
class User {
    @PrimaryGeneratedColumn()
    public id: number;

    @Column()
    @Index({ unique: true })
    public email: string;

    @Column()
    public name: string;

    @Column({ name: "ciphered_password" })
    public cipheredPassword: string;

    constructor(data?: UserData) {
        this.id = 0;
        this.email = data && data.email || "";
        this.name = data && data.name || "";
        this.cipheredPassword = data && data.cipheredPassword || "";
    }
}

type UserData = {
    email: string,
    name: string,
    cipheredPassword: string
};


export default User;
