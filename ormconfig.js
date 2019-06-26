const DB_HOST = process.env.DB_HOST;
const DB_PORT = process.env.DB_PORT;
const DB_NAME = process.env.DB_NAME;
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;


module.exports = {
    type: "postgres",
    host: DB_HOST,
    port: DB_PORT,
    database: DB_NAME,
    username: DB_USER,
    password: DB_PASSWORD,

    synchronize: false,
    logging: false,

    entities: [
        "src/models/entities/*.ts"
    ],
    migrations: [
        "src/models/migrations/*.ts"
    ],
    cli: {
        migrationsDir: "src/models/migrations"
    }
};
