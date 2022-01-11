import { Request } from "express";
import { User } from "../entity/User";

declare module "express-session" {
    interface SessionData {
        userId: string;
    }
}

export const login = (req: Request, user: User) => {
    req.session.userId = user.id;
    req.session.save();
};
