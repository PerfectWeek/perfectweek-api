import Boom from "@hapi/boom";
import Cors from "cors";
import ExpressApp, { Express, NextFunction, Request, Response, Router } from "express";
import Http, { Server as HttpServer } from "http";
import Morgan from "morgan";

export class Server {

    private readonly app: Express;
    private readonly httpServer: HttpServer;

    constructor(router: Router, config: Config) {
        this.app = ExpressApp();

        this.app.use(ExpressApp.json());
        this.app.use(Cors({
            origin: "*",
            methods: ["GET", "PUT", "POST", "DELETE"],
        }));
        this.app.use(Morgan(config.devMode ? "dev" : "combined"));

        this.app.use(router);

        this.add404Handler();
        this.addErrorHandler();

        this.httpServer = Http.createServer(this.app);
    }

    public readonly getServer = () => this.httpServer;

    public readonly start = (port: number, onStart: () => void) => {
        this.httpServer.listen(port, onStart);
    }

    private add404Handler(): void {
        this.app.use((_req: Request, res: Response, _next: NextFunction) => {
            res.status(404).json({
                message: "Route or resource not found",
            });
        });
    }

    private addErrorHandler(): void {
        this.app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
            if ((<any> error).isBoom) {
                const boom = <Boom> error;

                res.status(boom.output.statusCode).json({
                    message: boom.message,
                });
            }
            else {
                console.error(error.stack);
                res.status(500).json({
                    message: "Internal server error",
                });
            }
        });
    }
}

type Config = {
    devMode: boolean;
};
