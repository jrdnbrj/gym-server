import { randomUUID } from "crypto";
import { DateTime } from "luxon";
import { getConnection } from "typeorm";
import { testDb } from "../../../test/testDb";
import { genDbUser } from "../../../test/util/genDbUser";
import { genDbWeekSchedule } from "../../../test/util/genDbWeekSchedule";
import { genMockReq, genMockReqAsAdmin } from "../../../test/util/genMockReq";
import { Receipt } from "../../entity/Receipt";
import { instructorReferencedError, User } from "../../entity/User";
import { notEnoughPrivilegesError } from "../../error/notEnoughPrivilegesError";
import { notLoggedInError } from "../../error/notLoggedInError";
import { userDoesNotExistError } from "../../error/userDoesNotExistError";
import { AdminSubmitPaymentArgs } from "../args_type/AdminResolver.args";
import { adminSubmitPaymentMutation } from "./mutation/adminSubmitPaymentMutation";
import { adminUserRolesMutation } from "./mutation/adminUserRolesMutation";
import {
    gCallExpectFullPrivilegeUser,
    gCallExpectNoErrors,
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

const testSuccessfulAdminSubmitPayment = async (months?: number) => {
    const req = await genMockReqAsAdmin();

    const ws = await genDbWeekSchedule();
    const clientUser = await genDbUser({ isClient: true });

    // Register client to ws
    ws.students = Promise.resolve([(await clientUser.client)!]);
    await ws.save();

    // Mutation
    const data = await gCallExpectNoErrors(adminSubmitPaymentMutation, {
        variableValues: {
            clientID: clientUser.id,
            weekScheduleID: ws.id,
            months,
        } as AdminSubmitPaymentArgs,
        context: { req },
    });

    // Assert data
    const result = data.adminSubmitPayment;

    months = months || 1;
    const totalAmount = ws.price * months;

    expect(result).toMatchObject({
        clientID: clientUser.id,
        clientEmail: clientUser.email,
        weekScheduleID: ws.id,
        workoutTypeName: (await ws.workoutType).name,
        totalAmount,
    });

    const transactionDate = DateTime.fromISO(result.transactionDate);
    expect(transactionDate.diffNow().minutes).toBeLessThanOrEqual(1);

    const monthsDates: string[] = result.paidForMonthsDates;
    expect(monthsDates.length).toEqual(months);

    for (let i = 0; i < monthsDates.length; i++) {
        const date = DateTime.fromISO(monthsDates[i]);
        const expectedDate = DateTime.local().plus({ months: i });

        // Expect date to have correct month and year
        expect(date.month).toEqual(expectedDate.month);
        expect(date.year).toEqual(expectedDate.year);
    }

    // Assert db
    const receipt = await Receipt.findOne(result.id as string);
    expect(receipt).toMatchObject<Partial<Receipt>>({
        clientID: clientUser.id,
        clientEmail: clientUser.email,
        weekScheduleID: ws.id,
        workoutTypeName: (await ws.workoutType).name,
        totalAmount,
    });

    expect(
        DateTime.fromJSDate(receipt!.transactionDate).diffNow().minutes
    ).toBeLessThanOrEqual(1);

    // monthsDates = result.paidForMonthsDates;
    const paidForMonthsDates = receipt!.paidForMonthsDates;
    expect(paidForMonthsDates.length).toEqual(months);

    for (let i = 0; i < paidForMonthsDates.length; i++) {
        const date = DateTime.fromJSDate(paidForMonthsDates[i]);
        const expectedDate = DateTime.local().plus({ months: i });

        // Expect date to have correct month and year
        expect(date.month).toEqual(expectedDate.month);
        expect(date.year).toEqual(expectedDate.year);
    }
};

describe("adminSubmitPayment mutation", () => {
    test("should successfully submit a payment for one month (no explicit arg)", async () => {
        await testSuccessfulAdminSubmitPayment();
    });

    test("should successfully submit a payment for one month (explicit arg)", async () => {
        await testSuccessfulAdminSubmitPayment(1);
    });

    test("should successfully submit a payment for more than one month", async () => {
        await testSuccessfulAdminSubmitPayment(
            Math.floor(Math.random() * 10 + 1)
        );
    });

    test.todo("error when student is not in class");
    test.todo("error when class has already been paid");
    test.todo("error when months arg is 0 or less");
});
