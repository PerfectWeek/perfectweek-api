import { ConnectionOptions } from "typeorm";

export const load = (ormconfigPath: string): ConnectionOptions => {
    const typeormConfig = require(ormconfigPath);
    const dirName: string = __dirname.replace(/\\/g, "/"); // Replace '\' with '/' on Windows

    return {
        ...typeormConfig,

        cli: undefined,
        entities: [
            `${dirName}/models/entities/*{.ts,.js}`,
        ],
        migrations: undefined,
    };
};
