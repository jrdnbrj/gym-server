import { Request, Response } from "express";
import { Transporter } from "nodemailer";

export type RegularContext = {
    req: Request;
    res: Response;
    transporter: Transporter;
};
