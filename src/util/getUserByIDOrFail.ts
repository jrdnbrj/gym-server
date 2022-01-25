import { Client } from "../entity/Client";
import {Instructor} from "../entity/Instructor";
import { User } from "../entity/User";
import { userDoesNotExistError } from "../error/userDoesNotExistError";
import { userIsNotClientError, userIsNotInstructorError } from "../error/userIsNotRole";

/**Finds a user given an ID and throws an error if none is found.*/
export const getUserByIDOrFail = async (userID: string): Promise<User> => {
    const user = await User.findOne(userID);
    if (!user) throw userDoesNotExistError;

    return user;
};

/**Finds a user given an ID and throws an error if no user is found or if the found user is not a client..*/
export const getClientByIDOrFail = async (
    clientID: string
): Promise<[User, Client]> => {
    const user = await getUserByIDOrFail(clientID);
    const client = await user.client;

    if (!client) throw userIsNotClientError;

    return [user, client];
};

/**Finds a user given an ID and throws an error if no user is found or if the found user is not an instructor..*/
export const getInstructorByIDOrFail = async (
    clientID: string
): Promise<[User, Instructor]> => {
    const user = await getUserByIDOrFail(clientID);
    const instructor = await user.instructor;

    if (!instructor) throw userIsNotInstructorError;

    return [user, instructor];
};
