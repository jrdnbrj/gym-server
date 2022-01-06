import { Connection } from "typeorm";
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

let db: Connection;

beforeAll(async () => {
    db = await testDb(false);
});

afterAll(async () => {
    await db.close();
});

describe("userRegister mutation", () => {
    test("registering a no-privilege user", async () => {
        const user = genUserData();
        const userPassword = faker.internet.password();

        const data = await gCallExpectNoErrors(userRegisterMutation, {
            context: { db },
            variableValues: {
                ...user,
                password: userPassword,
                isClient: false,
                isInstructor: false,
                isAdmin: false,
            },
        });

        const result = data.userRegister;
        const { password } = result;
        expect(result).toBeTruthy();
        expect(result).toMatchObject<Partial<User>>({
            ...user,
            ...newNoPrivilegeUserFields,
        });

        expect(await verify(password, userPassword)).toEqual(true);

        // Test db object
        const dbUser = await User.findOne(result.id);

        expect(dbUser).toBeDefined();
        expect(dbUser).toMatchObject<Partial<User>>({
            id: Number.parseInt(result.id),
            ...user,
            isClient: false,
            isInstructor: false,
            isAdmin: false,
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
            contextValue: {
                db,
            },
        });

        // Test mutation results
        expect(errors).toBeTruthy();
        expect(data).toBeFalsy();

        expect(errors!.length).toEqual(1);
        expect(errors![0].message).toContain("Email ya existe");
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
            context: {
                db,
            },
        });

        const result = data!.userRegister;
        const { password } = result;
        expect(result).toBeTruthy();
        expect(result).toMatchObject<Partial<User>>({
            ...user,
            ...newFullPrivilegeUserFields,
        });

        expect(await verify(password, userPassword)).toEqual(true);

        // Test db object
        const dbUser = await User.findOne(result.id, {
            relations: ["instructor.weekSchedules"],
        });

        expect(dbUser).toBeDefined();
        expect(dbUser).toMatchObject<Partial<User>>({
            id: Number.parseInt(result.id),
            ...user,
            ...newFullPrivilegeUserFields,
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
            context: {
                db,
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
                    db,
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
                    db,
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
                db,
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
                db,
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
            context: {
                db,
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
            contextValue: {
                db,
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
            contextValue: {
                db,
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
        token.userID = 295;

        await token.save();

        let newPassword = faker.internet.password();

        const { data, errors } = await gCall({
            source: userChangePasswordMutation.loc!.source,
            variableValues: {
                token: token.token,
                newPassword,
            },
            contextValue: {
                db,
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

describe("useAll query", () => {
    test("userAll query with empty db", async () => {
        // Clear database
        await db.close();
        db = await testDb(true);

        // Query
        const data = await gCallExpectNoErrors(userAllQuery);

        expect(data.userAll).toBeTruthy();
        expect(data.userAll).toEqual([]);
    });

    /**No users have role-related data, like instructor.weekSchedules.*/
    test("userAll query with random new-users", async () => {
        // Clear database
        await db.close();
        db = await testDb(true);

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
            const i = resultUsers
                .map((u) => Number.parseInt(u.id as any))
                .indexOf(user.id);

            expect(i).toBeGreaterThanOrEqual(0);

            const roleFields = newUserRoleFields({
                isClient: user.isClient,
                isInstructor: user.isInstructor,
                isAdmin: user.isAdmin,
            });

            expect(resultUsers[i]).toMatchObject<Partial<User>>({
                id: user.id.toString() as any,
                firstName: user.firstName,
                lastName: user.lastName,
                ...roleFields,
            });
        }
    });
});
