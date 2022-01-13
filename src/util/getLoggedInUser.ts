import { Request } from "express";
import { User } from "../entity/User";
import { notLoggedInError } from "../error/notLoggedInError";
import { userDeletedError } from "../error/userDeletedError";

declare module "express-session" {
    interface SessionData {
        userId: string;
    }
}

export const getLoggedInUser = async (req: Request): Promise<User> => {
    const userId = req.session.userId;
    if (!userId) throw notLoggedInError;

    const user = await User.findOne(req.session.userId);
    if (!user) throw userDeletedError;

    return user;
};
