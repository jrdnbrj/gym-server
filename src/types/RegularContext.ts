import { Request, Response } from "express";

export type RegularContext = {
    req: Request;
    res: Response;
};
