import { MiddlewareFn } from "type-graphql";
import { RegularContext } from "../types/RegularContext";
import { ApolloError } from "apollo-server-core";
import { User } from "../entity/User";

declare module "express-session" {
    interface SessionData {
        userId: string;
    }
}

const RequireClient: MiddlewareFn<RegularContext> = async (
    { context },
    next
) => {
    const { req } = context;

    const loggedUserID = req.session.userId;
    if (!loggedUserID) {
        throw new ApolloError("Not logged in.");
    }

    // TODO: improve error message.
    const loggedUser = await User.findOne(loggedUserID);
    if (!loggedUser) {
        throw new ApolloError(
            "Logged in user has been deleted. Please, login again."
        );
    }

    if (!loggedUser.isClient) {
        throw new ApolloError("Not enough privileges. User is not a Client.");
    }

    return next();
};

export default RequireClient;
