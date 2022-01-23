import { Request } from "express";
import { Instructor } from "../entity/Instructor";
import { User } from "../entity/User";
import { notLoggedInError } from "../error/notLoggedInError";
import { userDeletedError } from "../error/userDeletedError";
import { userIsNotInstructorError } from "../error/userIsNotRole";

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

/**Gets the logged in user and throws an error if it is not an Instructor.*/
export const getLoggedInInstructor = async (
    req: Request
): Promise<[User, Instructor]> => {
    const user = await getLoggedInUser(req);
    const instructor = await user.instructor;

    if (!instructor) throw userIsNotInstructorError;
    return [user, instructor];
};
