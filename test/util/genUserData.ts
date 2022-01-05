import * as faker from "faker";

/**Generates random User data. Does not modify the database.*/
export const genUserData = () => {
    return {
        firstName: faker.name.firstName(),
        lastName: faker.name.lastName(),
        email: faker.internet.email(),
    };
};
