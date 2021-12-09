import { Request } from "express";
import { User } from "../entity/User";

export const login = (req: Request, user: User) => {
    req.session.userId = user.id;
    req.session.save();
};
