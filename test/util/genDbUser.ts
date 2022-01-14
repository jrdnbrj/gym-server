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
    let email = faker.internet.email();

    while (await User.findOne({ email })) email = faker.internet.email();

    let user = await User.new(
        faker.name.firstName(),
        faker.name.lastName(),
        email,
        password || faker.internet.password(),
        { isClient, isInstructor, isAdmin }
    );

    return await user.save();
};
