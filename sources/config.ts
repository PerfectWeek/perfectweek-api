import { envOrThrow } from "./utils/envOrThrow";

// tslint:disable-next-line: interface-name
export interface Config {
    readonly API_PORT: number;

    readonly JWT_SECRET_KEY: string;

    readonly ASSETS_ROOT_DIR: string;
}

export function loadConfig(): Config {
    return {
        API_PORT: Number.parseInt(envOrThrow("PORT", "3000"), 10),
        JWT_SECRET_KEY: envOrThrow("JWT_SECRET_KEY"),
        ASSETS_ROOT_DIR: envOrThrow("ASSETS_ROOT_DIR"),
    };
}
