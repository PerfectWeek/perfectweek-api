import "reflect-metadata";
import { createConnection, Connection } from "typeorm";

import * as DbConfig from "./dbConfig";
import * as Router from "./router";

import Server from "./Server";

import ApiEndpointController from "./controllers/ApiEndpointController";


const API_PORT: number = 3000;

function main(): void {
    const dbConfig = DbConfig.load("../ormconfig.js");

    createConnection(dbConfig)
        .then((conn: Connection) => {
            console.info("Connected to database");

            const server = createServer(conn);

            server.start(API_PORT);
        });
}

function createServer(_conn: Connection): Server {

    // Controllers
    const apiEndpointController = new ApiEndpointController();

    // Create Router
    const router = Router.createRouter(
        apiEndpointController
    );

    return new Server(router);
}


// Run only if executed directly (e.g: `ts-node src/main.ts`)
if (require.main === module) {
    main();
}
