//
// Configure connection from environment
//
const connectionOptions = {};

const DATABASE_URL = process.env.DATABASE_URL;

if (DATABASE_URL) {
    connectionOptions.url = DATABASE_URL;
} else {
    const DB_HOST = process.env.DB_HOST;
    const DB_PORT = process.env.DB_PORT;
    const DB_NAME = process.env.DB_NAME;
    const DB_USER = process.env.DB_USER;
    const DB_PASSWORD = process.env.DB_PASSWORD;

    if (DB_HOST !== undefined &&
        DB_PORT !== undefined &&
        DB_NAME !== undefined &&
        DB_USER !== undefined &&
        DB_PASSWORD !== undefined
    ) {
        connectionOptions.host = DB_HOST;
        connectionOptions.port = DB_PORT;
        connectionOptions.database = DB_NAME;
        connectionOptions.username = DB_USER;
        connectionOptions.password = DB_PASSWORD;
    } else {
        throw new Error(
            "Missing database configuration, the following environment variable must be provided:\n" +
            "    - Either:\n" +
            "        DATABASE_URL\n" +
            "    - Or:\n" +
            "        DB_HOST\n" +
            "        DB_PORT\n" +
            "        DB_NAME\n" +
            "        DB_USER\n" +
            "        DB_PASSWORD\n"
        );
    }
}


//
// Export DB connection options
//
module.exports = {
    type: "postgres",

    ...connectionOptions,

    synchronize: false,
    logging: false,

    entities: [
        "sources/models/entities/*.ts"
    ],
    migrations: [
        "sources/models/migrations/*.ts"
    ],
    cli: {
        migrationsDir: "sources/models/migrations"
    }
};
