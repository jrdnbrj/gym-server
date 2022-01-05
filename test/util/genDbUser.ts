import * as faker from "faker";
import { User } from "../../src/entity/User";

interface GenDbUserOptions {
    password?: string;
    isClient?: boolean;
    isInstructor?: boolean;
    isAdmin?: boolean;
}

/**Generates a User with random data and saves it in the database.
 *
 * By default, all roles are set to `false` and password is random.*/
export const genDbUser = async ({
    isClient,
    isInstructor,
    isAdmin,
    password,
}: GenDbUserOptions = {}): Promise<User> => {
    let user = await User.new(
        faker.name.firstName(),
        faker.name.lastName(),
        faker.internet.email(),
        password || faker.internet.password()
    );

    user.isClient = isClient || false;
    user.isInstructor = isInstructor || false;
    user.isAdmin = isAdmin || false;

    return await user.save();
};
