import { randomUUID } from "crypto";
import { getConnection } from "typeorm";
import { testDb } from "../../../test/testDb";
import { genDbUser } from "../../../test/util/genDbUser";
import { genDbWeekSchedule } from "../../../test/util/genDbWeekSchedule";
import { genMockReq } from "../../../test/util/genMockReq";
import { instructorReferencedError, User } from "../../entity/User";
import { notEnoughPrivilegesError } from "../../error/notEnoughPrivilegesError";
import { notLoggedInError } from "../../error/notLoggedInError";
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

    it("should error when not logged in (admin or not admin)", async () => {
        const req = genMockReq();

        const user = await genDbUser({
            isClient: true,
            isInstructor: true,
            isAdmin: true,
        });

        await gCallExpectOneError(
            adminUserRolesMutation,
            notLoggedInError.message,
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

        expect(await foundUser!.client).toBeDefined();
        expect(await foundUser!.instructor).toBeDefined();
        expect(await foundUser!.admin).toBeDefined();
    });

    it("should error when not logged in as an admin)", async () => {
        const nonAdmin = await genDbUser();

        const req = genMockReq();
        req.session.userId = nonAdmin.id;

        const user = await genDbUser({
            isClient: true,
            isInstructor: true,
            isAdmin: true,
        });

        await gCallExpectOneError(
            adminUserRolesMutation,
            notEnoughPrivilegesError.message,
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

        expect(await foundUser!.client).toBeDefined();
        expect(await foundUser!.instructor).toBeDefined();
        expect(await foundUser!.admin).toBeDefined();
    });

    it("should error if user's instructor has assigned schedules", async () => {
        const admin = await genDbUser({ isAdmin: true });

        const req = genMockReq();
        req.session.userId = admin.id;

        // Generate Instructor
        const ws = await genDbWeekSchedule();

        const user = await genDbUser({
            isInstructor: true,
        });

        const instructor = (await user.instructor)!;
        instructor.weekSchedules = Promise.resolve([ws]);
        await instructor.save();

        await gCallExpectOneError(
            adminUserRolesMutation,
            instructorReferencedError.message,
            {
                variableValues: {
                    userID: user.id,
                    isInstructor: false,
                },
                context: { req },
            }
        );

        // Test db
        const foundUser = await User.findOne(user.id);
        expect(foundUser).toBeDefined();

        expect(await foundUser!.instructor).toBeDefined();
    });
});

describe("adminSubmitPayment mutation", () => {
    test.todo("all adminSubmitPayment tests");
});
