import { Request, Response } from "express";

export class ApiEndpointController {

    private readonly faviconImage: string;

    constructor(
        // Images
        faviconImage: string,
    ) {
        this.faviconImage = faviconImage;
    }

    public readonly endpoint = (_req: Request, res: Response) => {
        res.status(200).json({
            message: "PerfectWeek API du swag !",
        });
    }

    public readonly favicon = (_req: Request, res: Response) => {
        res.status(200).sendFile(this.faviconImage);
    }
}
