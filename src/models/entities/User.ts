import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";
import CalendarMember from "./CalendarMember";


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

    @Column({ default: 0 })
    public timezone: number;

    public calendars?: CalendarMember[];

    constructor(data?: UserData) {
        this.id = 0;
        this.email = data && data.email || "";
        this.name = data && data.name || "";
        this.cipheredPassword = data && data.cipheredPassword || "";
        this.timezone = data && data.timezone || 0;

        this.calendars = undefined;
    }
}

type UserData = {
    email: string,
    name: string,
    cipheredPassword: string,
    timezone?: number
};


export default User;
