import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

import { GoogleProviderPayload } from "../../core/GoogleProviderPayload";

import { CalendarMember } from "./CalendarMember";
import { Event } from "./Event";

@Entity("users")
export class User {

    @PrimaryGeneratedColumn()
    public id: number;

    @Column()
    @Index({ unique: true })
    public email: string;

    @Column()
    public name: string;

    @Column({ type: "varchar", name: "ciphered_password", nullable: true, default: null })
    public cipheredPassword: string | null;

    @Column({ default: 0 })
    public timezone: number;

    @Column({ type: "json", name: "google_provider_payload", nullable: true, default: null })
    public googleProviderPayload: GoogleProviderPayload | null;

    public calendars?: CalendarMember[];
    public events?: Event[];

    constructor(data?: UserData) {
        this.id = 0;
        this.email = data && data.email || "";
        this.name = data && data.name || "";
        this.cipheredPassword = (data && data.cipheredPassword !== undefined)
            ? data.cipheredPassword
            : "";
        this.timezone = data && data.timezone || 0;
        this.googleProviderPayload = data && data.googleProviderPayload || null;

        this.calendars = undefined;
        this.events = undefined;
    }
}

type UserData = {
    email: string;
    name: string;
    cipheredPassword: string | null;
    timezone?: number;
    googleProviderPayload: GoogleProviderPayload | null;
};
