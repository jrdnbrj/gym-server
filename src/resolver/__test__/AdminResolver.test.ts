import { randomUUID } from "crypto";
import { getConnection } from "typeorm";
import { testDb } from "../../../test/testDb";
import { genDbUser } from "../../../test/util/genDbUser";
import { genMockReq } from "../../../test/util/genMockReq";
import { User } from "../../entity/User";
import { userDoesNotExistError } from "../../error/userDoesNotExistError";
import { adminUserRolesMutation } from "./mutation/adminUserRolesMutation";
import {
    gCallExpectFullPrivilegeUser,
    gCallExpectNoPrivilegeUser,
    gCallExpectOneError,
} from "./util/gCallExpect";

beforeAll(async () => {
    await testDb(false);
});

afterAll(async () => {
    await getConnection().close();
});

describe("adminUserRoles mutation", () => {
    it("should make a no-privilege user a full-privilege one", async () => {
        const admin = await genDbUser({ isAdmin: true });

        const req = genMockReq();
        req.session.userId = admin.id;

        const user = await genDbUser();

        await gCallExpectFullPrivilegeUser(
            adminUserRolesMutation,
            "adminUserRoles",
            user,
            {
                variableValues: {
                    userID: user.id,
                    isClient: true,
                    isInstructor: true,
                    isAdmin: true,
                },
                context: { req },
            }
        );

        // Test db
        const foundUser = await User.findOne(user.id);
        expect(foundUser).toBeDefined();

        expect(await foundUser!.client).toBeDefined();
        expect(await foundUser!.instructor).toBeDefined();
        expect(await foundUser!.admin).toBeDefined();
    });

    it("should revoke a full-privilege user's roles", async () => {
        const admin = await genDbUser({ isAdmin: true });

        const req = genMockReq();
        req.session.userId = admin.id;

        const user = await genDbUser({
            isClient: true,
            isInstructor: true,
            isAdmin: true,
        });

        await gCallExpectNoPrivilegeUser(
            adminUserRolesMutation,
            "adminUserRoles",
            user,
            {
                variableValues: {
                    userID: user.id,
                    isClient: false,
                    isInstructor: false,
                    isAdmin: false,
                },
                context: { req },
            }
        );

        // Test db
        const foundUser = await User.findOne(user.id);
        expect(foundUser).toBeDefined();

        expect(await foundUser!.client).toEqual(null);
        expect(await foundUser!.instructor).toEqual(null);
        expect(await foundUser!.admin).toEqual(null);
    });

    it("should throw an error given an wrong userID", async () => {
        const admin = await genDbUser({ isAdmin: true });

        const req = genMockReq();
        req.session.userId = admin.id;

        let wrongUserID = randomUUID();
        while (await User.findOne(wrongUserID)) wrongUserID = randomUUID();

        await gCallExpectOneError(
            adminUserRolesMutation,
            userDoesNotExistError.message,
            {
                variableValues: {
                    userID: wrongUserID,
                },
                context: { req },
            }
        );
    });

    it.todo("should error when not logged in as an admin");
    it.todo("should error user's instructor has assigned schedules");
});
