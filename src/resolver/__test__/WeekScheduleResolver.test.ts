import { Connection, getConnection } from "typeorm";
import { testDb } from "../../../test/testDb";
import { WeekSchedule } from "../../entity/WeekSchedule";
import { gCallExpectNoErrors } from "./util/gCallExpect";
import { weekScheduleAllQuery } from "./query/weekScheduleAllQuery";
import { User } from "../../entity/User";
import { genDbUser } from "../../../test/util/genDbUser";
import { genDbWeekSchedule } from "../../../test/util/genDbWeekSchedule";

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
test.todo("weekScheduleRemove mutation tests");
