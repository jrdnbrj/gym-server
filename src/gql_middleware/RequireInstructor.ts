import { MiddlewareFn } from "type-graphql";
import { RegularContext } from "../types/RegularContext";
import { ApolloError } from "apollo-server-core";
import { User } from "../entity/User";

declare module "express-session" {
    interface SessionData {
        userId: string;
    }
}

const RequireInstructor: MiddlewareFn<RegularContext> = async (
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

    if (!(await loggedUser.instructor)) {
        throw new ApolloError(
            "Not enough privileges. User is not an Instructor."
        );
    }

    return next();
};

export default RequireInstructor;
