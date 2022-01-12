import { Connection } from "typeorm";
import { testDb } from "../../../test/testDb";
import { WeekSchedule } from "../../entity/WeekSchedule";
import { gCallExpectNoErrors } from "./util/gCallExpect";
import { weekScheduleAllQuery } from "./query/weekScheduleAllQuery";
import { User } from "../../entity/User";
import { genDbUser } from "../../../test/util/genDbUser";
import { genDbWeekSchedule } from "../../../test/util/genDbWeekSchedule";

let db: Connection;

beforeAll(async () => {
    db = await testDb(false);
});

afterAll(async () => {
    await db.close();
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

            const originalWs = await WeekSchedule.findOne(foundWs!.id, {
                relations: ["students"],
            });

            expect(resultWs).toMatchObject({
                workoutType: {
                    name: (await originalWs!.workoutType).name,
                    emoji: (await originalWs!.workoutType).emoji,
                },
                quotas: originalWs!.quotas,
                students: originalWs!.students.map((x) => ({
                    id: x.id,
                })),
                instructor: {
                    id: (await (await originalWs!.instructor).user).id,
                },
                days: originalWs!.days,
                startDate: originalWs!.startDate.toISOString(),
            });
        }
    });
});
