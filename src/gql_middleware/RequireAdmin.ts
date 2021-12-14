import { MiddlewareFn } from "type-graphql";
import { RegularContext } from "../types/RegularContext";
import { User } from "../entity/User";
import { ApolloError } from "apollo-server-core";

declare module "express-session" {
    interface SessionData {
        userId: number;
    }
}

const RequireAdmin: MiddlewareFn<RegularContext> = async (
    { context },
    next
) => {
    const { req, db } = context;

    const loggedUserID = req.session.userId;
    if (!loggedUserID) {
        throw new ApolloError("Not logged in.");
    }

    // TODO: improve error message.
    const loggedUser = await db.manager.findOne(User, loggedUserID);
    if (!loggedUser) {
        throw new ApolloError(
            "Logged in user does not exist. Please, login again."
        );
    }

    if (!loggedUser.isAdmin) {
        throw new ApolloError("Not enough privileges.");
    }

    return next();
};

export default RequireAdmin;
