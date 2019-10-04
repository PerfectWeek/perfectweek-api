import { Request, Response } from "express";

export class AssistantController {
    public readonly findBestSlots = async (_req: Request, res: Response) => {
        res.status(200).json({
            message: "OK",
        });
    }

    public readonly eventSuggestion = async (_req: Request, res: Response) => {
        res.status(200).json({
            message: "OK",
        });
    }

    public readonly perfectWeek = async (_req: Request, res: Response) => {
        res.status(200).json({
            message: "OK",
        });
    }
}
