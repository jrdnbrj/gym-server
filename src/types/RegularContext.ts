import { Request, Response } from "express";
import { Connection } from "typeorm";
import { Transporter } from "nodemailer";

export type RegularContext = {
    req: Request;
    res: Response;
    db: Connection;
    transporter: Transporter;
};
