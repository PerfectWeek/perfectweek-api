import Boom from "@hapi/boom";
import Cors from "cors";
import ExpressApp, { Express, NextFunction, Request, Response, Router } from "express";
import Morgan from "morgan";

export class Server {

    private readonly app: Express;

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
    }

    public readonly start = (port: number, onStart: () => void) => {
        this.app.listen(port, onStart);
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
