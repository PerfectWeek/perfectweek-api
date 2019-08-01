import { Request, Response } from "express";


class ApiEndpointController {

    public readonly endpoint = (_req: Request, res: Response) => {
        res.status(200).json({
            message: "PerfectWeek API du swag !"
        });
    };
}


export default ApiEndpointController;
