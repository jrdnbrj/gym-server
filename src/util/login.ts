import { Request } from "express";
import { User } from "../entity/User";

// TODO: Move type declaration to another file.
declare module "express-session" {
    interface SessionData {
        userId: number;
    }
}

export const login = (req: Request, user: User) => {
    req.session.userId = user.id;
    req.session.save();
};