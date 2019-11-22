import { envOrThrow } from "./utils/envOrThrow";
import { parseBool } from "./utils/parseBool";

// tslint:disable-next-line: interface-name
export interface Config {
    readonly NODE_ENV: string;

    readonly API_PORT: number;

    readonly JWT_SECRET_KEY: string;

    readonly ASSETS_ROOT_DIR: string;

    readonly EMAIL_ENABLED: boolean;
    readonly EMAIL_FROM: string;
    readonly MAILGUN_API_KEY?: string;
    readonly MAILGUN_DOMAIN?: string;

    readonly FRONT_END_HOST: string;

    readonly GOOGLE_CLIENT_ID: string;
    readonly GOOGLE_SECRET_ID: string;
}

export function loadConfig(): Config {
    // Node env
    const NODE_ENV = envOrThrow("NODE_ENV", "development");
    switch (NODE_ENV) {
        case "development": break;
        case "production": break;
        default: throw new Error(`Invalid NODE_ENV "${NODE_ENV}"`);
    }

    // Mailer
    const EMAIL_ENABLED = parseBool(envOrThrow("EMAIL_ENABLED", "false"));
    if (EMAIL_ENABLED === undefined) {
        throw new Error("Invalid value for env variable EMAIL_ENABLED");
    }
    let EMAIL_FROM = "";
    let MAILGUN_API_KEY: string | undefined;
    let MAILGUN_DOMAIN: string | undefined;
    if (EMAIL_ENABLED) {
        EMAIL_FROM = envOrThrow("EMAIL_FROM");
        MAILGUN_API_KEY = envOrThrow("MAILGUN_API_KEY");
        MAILGUN_DOMAIN = envOrThrow("MAILGUN_DOMAIN");
    }

    return {
        NODE_ENV: NODE_ENV,

        API_PORT: Number.parseInt(envOrThrow("PORT", "3000"), 10),

        JWT_SECRET_KEY: envOrThrow("JWT_SECRET_KEY"),

        ASSETS_ROOT_DIR: envOrThrow("ASSETS_ROOT_DIR"),

        EMAIL_ENABLED: EMAIL_ENABLED,
        EMAIL_FROM: EMAIL_FROM,
        MAILGUN_API_KEY: MAILGUN_API_KEY,
        MAILGUN_DOMAIN: MAILGUN_DOMAIN,

        FRONT_END_HOST: envOrThrow("FRONT_END_HOST"),

        GOOGLE_CLIENT_ID: envOrThrow("GOOGLE_CLIENT_ID"),
        GOOGLE_SECRET_ID: envOrThrow("GOOGLE_SECRET_ID"),
    };
}
