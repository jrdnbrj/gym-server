import { getConnection } from "typeorm";
import { testDb } from "../../../test/testDb";
import { userRegisterMutation } from "./mutation/userRegisterMutation";
import * as faker from "faker";
import { verify } from "argon2";
import { User } from "../../entity/User";
import { genDbUser } from "../../../test/util/genDbUser";
import { genUserData } from "../../../test/util/genUserData";
import { gCall } from "../../../test/util/gCall";
import { userByIdQuery } from "./query/userByIdQuery";
import {
    newFullPrivilegeUserFields,
    newNoPrivilegeUserFields,
    newUserRoleFields,
} from "./util/newUserFields";
import { userLoginMutation } from "./mutation/userLoginMutation";
import { genMockReq } from "../../../test/util/genMockReq";
import { userLogoutMutation } from "./mutation/userLogoutMutation";
import { userMeQuery } from "./query/userMeQuery";
import { login } from "../../util/login";
import {
    gCallExpectFullPrivilegeUser,
    gCallExpectNoErrors,
    gCallExpectNoPrivilegeUser,
} from "./util/gCallExpect";
import { ForgotPasswordToken } from "../../entity/ForgotPasswordToken";
import { userChangePasswordMutation } from "./mutation/userChangePasswordMutation";
import { userAllQuery } from "./query/userAllQuery";
import { randomUUID } from "crypto";
import Admin from "../../entity/Admin";
import { Client } from "../../entity/Client";
import { Instructor } from "../../entity/Instructor";
import { userEditInfoMutation } from "./mutation/userEditInfoMutation";
import { UserInfoInput } from "../../input/UserInfoInput";
import { emailTakenError } from "../../error/emailTakenError";

beforeAll(async () => {
    await testDb(false);
});

afterAll(async () => {
    await getConnection().close();
});

describe("userRegister mutation", () => {
    test("registering a no-privilege user", async () => {
        const user = genUserData();
        const userPassword = faker.internet.password();

        const data = await gCallExpectNoErrors(userRegisterMutation, {
            variableValues: {
                ...user,
                password: userPassword,
                isClient: false,
                isInstructor: false,
                isAdmin: false,
            },
        });

        const result = data.userRegister;

        expect(result).toBeTruthy();
        expect(result).toMatchObject({
            ...user,
            ...newNoPrivilegeUserFields,
        });

        const { password } = result;
        expect(await verify(password, userPassword)).toEqual(true);

        // Test db object
        const dbUser = await User.findOne(result.id);

        expect(dbUser).toBeDefined();
        expect(dbUser).toMatchObject<Partial<User>>({
            ...user,
            client: Promise.resolve(null),
            instructor: Promise.resolve(null),
            admin: Promise.resolve(null),
        });

        expect(await verify(dbUser!.getPassword(), userPassword));
    });

    it("should throw an ApolloError when registering a user with duplicate email", async () => {
        // Generate first user
        const firstUser = await genDbUser();

        // Create duplicate-email user.
        const user = genUserData();
        user.email = firstUser.email;
        const userPassword = faker.internet.password();

        const { data, errors } = await gCall({
            source: userRegisterMutation.loc!.source,
            variableValues: {
                ...user,
                password: userPassword,
                isClient: false,
                isInstructor: false,
                isAdmin: false,
            },
        });

        // Test mutation results
        expect(errors).toBeTruthy();
        expect(data).toBeFalsy();

        expect(errors!.length).toEqual(1);
        expect(errors![0].message.toLowerCase()).toContain("email ya existe");
    });

    test("registering a full-privilege user", async () => {
        const user = genUserData();
        const userPassword = faker.internet.password();

        const data = await gCallExpectNoErrors(userRegisterMutation, {
            variableValues: {
                ...user,
                password: userPassword,
                isClient: true,
                isInstructor: true,
                isAdmin: true,
            },
        });

        const result = data!.userRegister;

        expect(result).toBeTruthy();
        expect(result).toMatchObject({
            ...user,
            ...newFullPrivilegeUserFields,
        });

        const { password } = result;
        expect(await verify(password, userPassword)).toEqual(true);

        // Test db object
        const dbUser = await User.findOne(result.id);

        expect(dbUser).toBeDefined();
        expect(dbUser).toMatchObject<Partial<User>>({
            ...user,
            client: Promise.resolve(new Client()),
            instructor: Promise.resolve(new Instructor()),
            admin: Promise.resolve(new Admin()),
        });

        expect(await verify(dbUser!.getPassword(), userPassword));
    });
});

describe("userByID query", () => {
    // TODO: Create tests for userByID with non-new users (instructors with assigned schedules, etc).

    test("userByID query with new full-privilege user", async () => {
        const dbUser = await genDbUser({
            isClient: true,
            isInstructor: true,
            isAdmin: true,
        });

        await gCallExpectFullPrivilegeUser(userByIdQuery, "userByID", dbUser, {
            variableValues: { userID: dbUser.id },
        });
    });

    test("userByID query with new no-privilege user", async () => {
        const dbUser = await genDbUser();

        await gCallExpectNoPrivilegeUser(userByIdQuery, "userByID", dbUser, {
            variableValues: {
                userID: dbUser.id,
            },
        });
    });
});

describe("userLogin mutation", () => {
    test("userLogin mutation on new no-privilege user", async () => {
        const userPassword = faker.internet.password();
        const dbUser = await genDbUser({ password: userPassword });

        const req = genMockReq();

        await gCallExpectNoPrivilegeUser(
            userLoginMutation,
            "userLogin",
            dbUser,
            {
                variableValues: {
                    email: dbUser.email,
                    password: userPassword,
                },
                context: {
                    req,
                },
            }
        );

        // Test session value
        expect(req.session.userId).toBeDefined();
        expect(req.session.userId).toEqual(dbUser.id);
        expect(req.session.save).toHaveBeenCalled();
    });

    test("userLogin mutation on new full-privilege user", async () => {
        const userPassword = faker.internet.password();
        const dbUser = await genDbUser({
            isClient: true,
            isInstructor: true,
            isAdmin: true,
            password: userPassword,
        });

        const req = genMockReq();

        await gCallExpectFullPrivilegeUser(
            userLoginMutation,
            "userLogin",
            dbUser,
            {
                context: {
                    req,
                },
                variableValues: {
                    email: dbUser.email,
                    password: userPassword,
                },
            }
        );

        // Test session value
        expect(req.session.userId).toBeDefined();
        expect(req.session.userId).toEqual(dbUser.id);
        expect(req.session.save).toHaveBeenCalled();
    });

    it("should throw an ApolloError when using an incorrect password", async () => {
        const userPassword = faker.internet.password();
        const dbUser = await genDbUser({
            isClient: true,
            isInstructor: true,
            isAdmin: true,
            password: userPassword,
        });

        let incorrectPassword = faker.internet.password();
        while (userPassword == incorrectPassword) {
            incorrectPassword = faker.internet.password();
        }

        const req = genMockReq();

        const { data, errors } = await gCall({
            source: userLoginMutation.loc!.source,
            variableValues: {
                email: dbUser.email,
                password: incorrectPassword,
            },
            contextValue: {
                req,
            },
        });

        // Test mutation results
        expect(errors).toBeTruthy();
        expect(data).toBeFalsy();

        expect(errors!.length).toEqual(1);
        expect(errors![0].message).toContain("contraseña inválida");

        // Test session value
        expect(req.session.userId).toBeUndefined();
        expect(req.session.save).toHaveBeenCalledTimes(0);
    });
});

describe("userLogout mutation", () => {
    test("successful userLogout mutation", async () => {
        const req = genMockReq();

        const { data, errors } = await gCall({
            source: userLogoutMutation.loc!.source,
            contextValue: {
                req,
            },
        });

        // Test session
        expect(req.session.destroy).toHaveBeenCalled();

        // Test mutation results
        expect(errors).toBeFalsy();
        expect(data).toBeTruthy();

        expect(data!.userLogout).toBeDefined();
        expect(data!.userLogout).toEqual(true);
    });

    test("unsuccessful userLogout mutation", async () => {
        const req = genMockReq();
        req.session.destroy = jest.fn((callback: (err: any) => void) => {
            callback("Mock error!");
        }) as any;

        const { data, errors } = await gCall({
            source: userLogoutMutation.loc!.source,
            contextValue: {
                req,
            },
        });

        // Test session
        expect(req.session.destroy).toHaveBeenCalled();

        // Test mutation results
        expect(errors).toBeTruthy();
        expect(data).toBeFalsy();

        expect(errors!.length).toEqual(1);
        expect(errors![0].message).toEqual("Mock error!");
    });
});

describe("userMe query", () => {
    test("userMe query when not logged in", async () => {
        const req = genMockReq();

        const data = await gCallExpectNoErrors(userMeQuery, {
            context: {
                req,
            },
        });

        expect(data.userMe).toBeNull();
    });

    test("userMe query when logged in as new full-privilege user", async () => {
        const dbUser = await genDbUser({
            isClient: true,
            isInstructor: true,
            isAdmin: true,
        });
        const req = genMockReq();

        login(req, dbUser);

        await gCallExpectFullPrivilegeUser(userMeQuery, "userMe", dbUser, {
            context: {
                req,
            },
        });
    });
});

describe("userChangePassword mutation", () => {
    it("should change a user's password with encryption", async () => {
        const userPassword = faker.internet.password();
        const user = await genDbUser({ password: userPassword });

        const token = new ForgotPasswordToken();
        token.token = "my-token";
        token.userID = user.id;

        await token.save();

        let newPassword = faker.internet.password();
        while (userPassword == newPassword) {
            newPassword = faker.internet.password();
        }

        const data = await gCallExpectNoErrors(userChangePasswordMutation, {
            variableValues: {
                token: token.token,
                newPassword,
            },
        });

        expect(data.userChangePassword).toEqual(true);

        // Check new password
        const modifiedUser = await User.findOne(user.id);

        expect(modifiedUser).toBeTruthy();
        expect(await verify(modifiedUser!.getPassword(), newPassword)).toEqual(
            true
        );
    });

    it("should delete token from db after calling mutation", async () => {
        const user = await genDbUser();

        const token = new ForgotPasswordToken();
        token.token = "my-token";
        token.userID = user.id;

        await token.save();

        let newPassword = faker.internet.password();

        await gCall({
            source: userChangePasswordMutation.loc!.source,
            variableValues: {
                token: token.token,
                newPassword,
            },
        });

        const dbToken = await ForgotPasswordToken.findOne(token.token);
        expect(dbToken).toBeFalsy();
    });

    it("should throw an error when using an incorrect token", async () => {
        const userPassword = faker.internet.password();
        const user = await genDbUser({ password: userPassword });

        const token = new ForgotPasswordToken();
        token.token = "my-token";
        token.userID = user.id;

        await token.save();

        let newPassword = faker.internet.password();
        while (userPassword == newPassword) {
            newPassword = faker.internet.password();
        }

        const { data, errors } = await gCall({
            source: userChangePasswordMutation.loc!.source,
            variableValues: {
                token: "incorrect-token",
                newPassword,
            },
        });

        expect(data).toBeFalsy();
        expect(errors).toBeTruthy();

        expect(errors!.length).toEqual(1);
        expect(errors![0].message.toLowerCase()).toContain(
            "token doesn't exist"
        );
    });

    it("should throw an error when token's userID is invalid", async () => {
        const token = new ForgotPasswordToken();
        token.token = "my-token";
        token.userID = randomUUID();

        await token.save();

        let newPassword = faker.internet.password();

        const { data, errors } = await gCall({
            source: userChangePasswordMutation.loc!.source,
            variableValues: {
                token: token.token,
                newPassword,
            },
        });

        expect(data).toBeFalsy();
        expect(errors).toBeTruthy();

        expect(errors!.length).toEqual(1);
        expect(errors![0].message.toLowerCase()).toContain(
            "user does not exist"
        );
    });
});

describe("userAll query", () => {
    test("userAll query with empty db", async () => {
        // Clear database
        await User.delete({});

        // Query
        const data = await gCallExpectNoErrors(userAllQuery);

        expect(data.userAll).toBeTruthy();
        expect(data.userAll).toEqual([]);
    });

    /**No users have role-related data, like instructor.weekSchedules.*/
    test("userAll query with random new-users", async () => {
        // Clear database
        await User.delete({});

        // Generate random new-users
        const testUsers: User[] = [];
        for (let i = 0; i < 50; i++) {
            const isClient = Math.random() < 0.5;
            const isInstructor = Math.random() < 0.5;
            const isAdmin = Math.random() < 0.5;

            const newUser = await genDbUser({
                isClient,
                isInstructor,
                isAdmin,
            });

            testUsers.push(newUser);
        }

        // Query
        const data = await gCallExpectNoErrors(userAllQuery);
        const resultUsers: User[] = data.userAll;

        for (let user of testUsers) {
            const i = resultUsers.map((u) => u.id).indexOf(user.id);

            expect(i).toBeGreaterThanOrEqual(0);

            const roleFields = newUserRoleFields({
                isClient: !!(await user.client),
                isInstructor: !!(await user.instructor),
                isAdmin: !!(await user.admin),
            });

            expect(resultUsers[i]).toMatchObject<Partial<User>>({
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                ...roleFields,
            });
        }
    });
});

describe("userEditInfo mutation", () => {
    test("should change all 3 user fields", async () => {
        const user = await genDbUser();

        const firstName = faker.name.firstName();
        const lastName = faker.name.lastName();

        let email = faker.internet.email();
        while (await User.findOne({ email })) {
            email = faker.internet.email();
        }

        const expectedUser: User = User.create({
            firstName,
            lastName,
            email,
        });

        // Simulate req
        const req = genMockReq();
        req.session.userId = user.id;

        // Mutation
        const variableValues: UserInfoInput = {
            firstName,
            lastName,
            email,
        };

        await gCallExpectNoPrivilegeUser(
            userEditInfoMutation,
            "userEditInfo",
            expectedUser,
            { variableValues, context: { req } }
        );

        // Assert db
        const foundUser = await User.findOne(user.id);

        expect(foundUser).toBeDefined();
        expect(foundUser!.firstName).toEqual(firstName);
        expect(foundUser!.lastName).toEqual(lastName);
        expect(foundUser!.email).toEqual(email);
    });

    test("should not modify user when not given any new values", async () => {
        const user = await genDbUser();

        // Simulate req
        const req = genMockReq();
        req.session.userId = user.id;

        await gCallExpectNoPrivilegeUser(
            userEditInfoMutation,
            "userEditInfo",
            user,
            { context: { req } }
        );

        // Assert db
        const foundUser = await User.findOne(user.id);

        expect(foundUser).toBeDefined();
        expect(foundUser!.firstName).toEqual(user.firstName);
        expect(foundUser!.lastName).toEqual(user.lastName);
        expect(foundUser!.email).toEqual(user.email);
    });

    test("should error when given a taken newEmail", async () => {
        const constUser = await genDbUser();
        const mutUser = await genDbUser();

        // Simulate req
        const req = genMockReq();
        req.session.userId = mutUser.id;

        const variableValues: UserInfoInput = {
            email: constUser.email,
        };

        const { data, errors } = await gCall({
            source: userEditInfoMutation.loc!.source,
            variableValues,
            contextValue: { req },
        });

        expect(data).toBeFalsy();
        expect(errors).toBeDefined();

        expect(errors!.length).toEqual(1);
        expect(errors![0].message).toEqual(emailTakenError.message);

        // Assert user hasn't changed.
        const foundUser = await User.findOne(mutUser.id);

        expect(foundUser).toBeDefined();
        expect(foundUser!.firstName).toEqual(mutUser.firstName);
        expect(foundUser!.lastName).toEqual(mutUser.lastName);
        expect(foundUser!.email).toEqual(mutUser.email);
    });
});
