import { MiddlewareFn } from "type-graphql";
import { RegularContext } from "../types/RegularContext";
import { User } from "../entity/User";
import { ApolloError } from "apollo-server-core";
import { notLoggedInError } from "../error/notLoggedInError";
import { userDeletedError } from "../error/userDeletedError";
import { notEnoughPrivilegesError } from "../error/notEnoughPrivilegesError";

declare module "express-session" {
    interface SessionData {
        userId: string;
    }
}

const RequireAdmin: MiddlewareFn<RegularContext> = async (
    { context },
    next
) => {
    const { req } = context;

    const loggedUserID = req.session.userId;
    if (!loggedUserID) {
        throw notLoggedInError;
    }

    // TODO: improve error message.
    const loggedUser = await User.findOne(loggedUserID);
    if (!loggedUser) {
        throw userDeletedError;
    }

    if (!(await loggedUser.admin)) {
        throw notEnoughPrivilegesError;
    }

    return next();
};

export default RequireAdmin;
