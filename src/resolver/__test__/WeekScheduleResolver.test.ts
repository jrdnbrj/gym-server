import { getConnection } from "typeorm";
import { testDb } from "../../../test/testDb";
import { WeekSchedule } from "../../entity/WeekSchedule";
import {
    gCallExpectNoErrors,
    gCallExpectNotEnoughPrivilegesError,
    gCallExpectNotLoggedInError,
    gCallExpectOneError,
} from "./util/gCallExpect";
import { weekScheduleAllQuery } from "./query/weekScheduleAllQuery";
import { User } from "../../entity/User";
import { genDbUser } from "../../../test/util/genDbUser";
import { genDbWeekSchedule } from "../../../test/util/genDbWeekSchedule";
import { weekScheduleRemove } from "./mutation/weekScheduleRemove";
import { genMockReq, genMockReqAsAdmin } from "../../../test/util/genMockReq";
import { weekScheduleHasStudentsError } from "../WeekScheduleResolver";
import { weekScheduleChangeInstructorMutation } from "./mutation/weekScheduleChangeInstructorMutation";
import { WeekScheduleChangeInstructorArgs } from "../args_type/WeekScheduleResolver.args";
import { userIsNotInstructorError } from "../../error/userIsNotRole";

beforeAll(async () => {
    await testDb(false);
});

afterAll(async () => {
    await getConnection().close();
});

describe("weekScheduleAll query", () => {
    test("on empty db", async () => {
        await WeekSchedule.delete({});

        const data = await gCallExpectNoErrors(weekScheduleAllQuery);

        expect(data.weekScheduleAll).toBeTruthy();

        const result = data.weekScheduleAll;
        expect(result).toEqual([]);
    });

    test("with random weekSchedules", async () => {
        const instructors: User[] = [];

        let n = Math.random() * 5 + 1;
        for (let i = 0; i < n; i++) {
            instructors.push(
                await genDbUser({
                    isInstructor: true,
                })
            );
        }

        const ws: WeekSchedule[] = [];

        n = Math.random() * 10 + 1;
        for (let i = 0; i < n; i++) {
            ws.push(
                await genDbWeekSchedule({
                    instructor:
                        instructors[
                            Math.floor(Math.random() * instructors.length)
                        ],
                    genRandomStudents: true,
                })
            );
        }

        const data = await gCallExpectNoErrors(weekScheduleAllQuery);

        const result: WeekSchedule[] | null = data.weekScheduleAll;
        expect(result).toBeTruthy();

        expect(result!.length).toEqual(ws.length);
        for (let resultWs of result!) {
            const foundWs = ws.find((w) => w.id == resultWs.id);

            expect(foundWs).toBeDefined();

            const students = await foundWs!.students;
            const studentsUsers = await Promise.all(
                students.map(async (s) => await s.user)
            );

            expect(resultWs).toMatchObject({
                workoutType: {
                    name: (await foundWs!.workoutType).name,
                    emoji: (await foundWs!.workoutType).emoji,
                },
                quotas: foundWs!.quotas,
                students: studentsUsers.map((x) => ({
                    id: x.id,
                })),
                instructor: {
                    id: (await (await foundWs!.instructor).user).id,
                },
                days: foundWs!.days,
                startDate: foundWs!.startDate.toISOString(),
            });
        }
    });
});

test.todo("weekScheduleCreate mutation tests");
test.todo("weekScheduleAddStudent mutation tests");

describe("weekScheduleRemove mutation", () => {
    test("successfully removing a weekSchedule", async () => {
        const req = await genMockReqAsAdmin();
        const ws = await genDbWeekSchedule();

        const data = await gCallExpectNoErrors(weekScheduleRemove, {
            context: { req },
            variableValues: { weekScheduleID: ws.id },
        });

        expect(data.weekScheduleRemove).toEqual(true);

        // Assert db
        const foundWs = await WeekSchedule.findOne(ws.id);
        expect(foundWs).toBeUndefined();
    });

    it("should error when ws has students", async () => {
        const req = await genMockReqAsAdmin();
        const ws = await genDbWeekSchedule({ genRandomStudents: true });

        await gCallExpectOneError(
            weekScheduleRemove,
            weekScheduleHasStudentsError.message,
            {
                context: { req },
                variableValues: {
                    weekScheduleID: ws.id,
                },
            }
        );
    });

    it("should error if not logged in", async () => {
        const req = genMockReq();
        const ws = await genDbWeekSchedule();

        await gCallExpectNotLoggedInError(weekScheduleRemove, {
            context: {
                req,
            },
            variableValues: {
                weekScheduleID: ws.id,
            },
        });

        // Test ws is unchanged
        expect(await WeekSchedule.findOne(ws.id)).toBeDefined();
    });

    it("should error if not logged in as admin", async () => {
        const nonAdmin = await genDbUser();

        const req = genMockReq();
        req.session.userId = nonAdmin.id;

        const ws = await genDbWeekSchedule();

        await gCallExpectNotEnoughPrivilegesError(weekScheduleRemove, {
            context: {
                req,
            },
            variableValues: {
                weekScheduleID: ws.id,
            },
        });

        // Test ws is unchanged
        expect(await WeekSchedule.findOne(ws.id)).toBeDefined();
    });
});

describe("weekScheduleChangeInstructor", () => {
    it("should error if not logged in", async () => {
        const req = genMockReq();
        const ws = await genDbWeekSchedule();

        const instUser = await genDbUser({ isInstructor: true });

        await gCallExpectNotLoggedInError(
            weekScheduleChangeInstructorMutation,
            {
                context: {
                    req,
                },
                variableValues: {
                    weekScheduleID: ws.id as any,
                    instructorID: instUser.id,
                } as WeekScheduleChangeInstructorArgs,
            }
        );

        // Test ws is unchanged
        const foundWs = await WeekSchedule.findOne(ws.id);
        expect((await foundWs!.instructor).id).toEqual(
            (await ws.instructor)!.id
        );
    });

    it("should error if not logged in as admin", async () => {
        const nonAdmin = await genDbUser();

        const req = genMockReq();
        req.session.userId = nonAdmin.id;

        const ws = await genDbWeekSchedule();
        const instUser = await genDbUser({ isInstructor: true });

        await gCallExpectNotEnoughPrivilegesError(
            weekScheduleChangeInstructorMutation,
            {
                context: {
                    req,
                },
                variableValues: {
                    weekScheduleID: ws.id as any,
                    instructorID: instUser.id,
                } as WeekScheduleChangeInstructorArgs,
            }
        );

        // Test ws is unchanged
        expect(await WeekSchedule.findOne(ws.id)).toBeDefined();
    });

    it("should successfully change a ws' instructor", async () => {
        const req = await genMockReqAsAdmin();

        const ws = await genDbWeekSchedule();
        const instUser = await genDbUser({ isInstructor: true });

        const data = await gCallExpectNoErrors(
            weekScheduleChangeInstructorMutation,
            {
                context: {
                    req,
                },
                variableValues: {
                    weekScheduleID: ws.id as any,
                    instructorID: instUser.id,
                } as WeekScheduleChangeInstructorArgs,
            }
        );

        const result = data.weekScheduleChangeInstructor;
        expect(result).toMatchObject({
            instructor: {
                id: instUser.id,
            },
        });

        // Test ws
        const foundWs = await WeekSchedule.findOne(ws.id);

        expect(foundWs).toBeDefined();
        expect(await foundWs!.instructor).toEqual(await instUser.instructor);
    });

    it("should error when instructorID's user is not an instructor", async () => {
        const req = await genMockReqAsAdmin();

        const ws = await genDbWeekSchedule();
        const nonInstUser = await genDbUser();

        await gCallExpectOneError(
            weekScheduleChangeInstructorMutation,
            userIsNotInstructorError.message,
            {
                context: {
                    req,
                },
                variableValues: {
                    weekScheduleID: ws.id as any,
                    instructorID: nonInstUser.id,
                } as WeekScheduleChangeInstructorArgs,
            }
        );

        // Test ws is unchanged
        const foundWs = await WeekSchedule.findOne(ws.id);

        expect(foundWs).toBeDefined();
        expect(await foundWs!.instructor).toEqual(await ws.instructor);
    });
});

test.todo("weekScheduleEdit resolver");
