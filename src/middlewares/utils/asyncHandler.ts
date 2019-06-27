import { Request, Response, NextFunction } from "express";


type Handler = (req: Request, res: Response, next?: NextFunction) => Promise<any>;

const asyncHandler = (handler: Handler) => (req: Request, res: Response, next: NextFunction) => {
    return Promise
        .resolve(handler(req, res, next))
        .catch(next);
};


export default asyncHandler;
