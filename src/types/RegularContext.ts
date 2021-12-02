import { Request, Response } from "express";
import { Connection } from "typeorm";

export type RegularContext = {
    req: Request;
    res: Response;
    db: Connection;
};
