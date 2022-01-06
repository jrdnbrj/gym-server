import { Connection } from "typeorm";
import { testDb } from "../../../test/testDb";
import { WorkoutType } from "../../entity/WorkoutType";
import { workoutTypeAllQuery } from "./query/workoutTypeAllQuery";
import { gCallExpectNoErrors } from "./util/gCallExpect";
import * as faker from "faker";
import { randomEmoji } from "../../../test/util/randomEmoji";
import { workoutTypeCreateMutation } from "./mutation/workoutTypeCreateMutation";
import { gCall } from "../../../test/util/gCall";

let db: Connection;

beforeAll(async () => {
    db = await testDb(false);
});

afterAll(async () => {
    await db.close();
});

describe("workoutTypeAll query", () => {
    test("on empty db", async () => {
        await WorkoutType.getRepository().delete({});

        const data = await gCallExpectNoErrors(workoutTypeAllQuery);

        expect(data).toBeTruthy();
        expect(data.workoutTypeAll).toEqual([]);
    });

    test("with random WorkoutTypes", async () => {
        await WorkoutType.getRepository().delete({});

        const testTypes: WorkoutType[] = [];

        // Random n between 50 and 100.
        const n = Math.random() * 50 + 50;
        for (let i = 0; i < n; i++) {
            let wType = new WorkoutType();

            wType.name = faker.datatype.uuid();
            wType.emoji = randomEmoji();

            while (testTypes.map((t) => t.emoji).indexOf(wType.emoji) >= 0)
                wType.emoji = randomEmoji();

            testTypes.push(await wType.save());
        }

        // Query
        const data = await gCallExpectNoErrors(workoutTypeAllQuery);
        expect(data.workoutTypeAll).toBeTruthy();

        for (const wType of testTypes) {
            expect(data.workoutTypeAll).toContainEqual(wType);
        }
    });
});

describe("workoutTypeCreate mutation", () => {
    it("should successfully create and save a new WorkoutType", async () => {
        const newTypeInfo: Partial<WorkoutType> = {
            name: faker.datatype.uuid(),
            emoji: randomEmoji(),
        };

        // Query
        const data = await gCallExpectNoErrors(workoutTypeCreateMutation, {
            variableValues: newTypeInfo,
        });

        const result = data.workoutTypeCreate;
        expect(result).toBeTruthy();

        expect(result).toEqual(newTypeInfo);
    });

    it("should fail when using a duplicate name", async () => {
        const oldType = WorkoutType.create({
            name: faker.datatype.uuid(),
            emoji: randomEmoji(),
        });

        await oldType.save();

        const { data, errors } = await gCall({
            source: workoutTypeCreateMutation.loc!.source,
            variableValues: {
                name: oldType.name,
                emoji: randomEmoji(),
            },
        });

        expect(data).toBeFalsy();
        expect(errors).toBeTruthy();

        expect(errors!.length).toEqual(1);
        expect(errors![0].message.toLowerCase()).toContain("already exists");
    });

    it("should fail when using a duplicate emoji", async () => {
        const oldType = WorkoutType.create({
            name: faker.datatype.uuid(),
            emoji: randomEmoji(),
        });

        await oldType.save();

        const { data, errors } = await gCall({
            source: workoutTypeCreateMutation.loc!.source,
            variableValues: {
                name: faker.datatype.uuid(),
                emoji: oldType.emoji,
            },
        });

        expect(data).toBeFalsy();
        expect(errors).toBeTruthy();

        expect(errors!.length).toEqual(1);
        expect(errors![0].message.toLowerCase()).toContain(
            "with given emoji already exists"
        );
    });

    it("should fail when given a non-emoji as argument", async () => {
        const { data, errors } = await gCall({
            source: workoutTypeCreateMutation.loc!.source,
            variableValues: {
                name: faker.datatype.uuid(),
                emoji: faker.random.word(),
            },
        });

        expect(data).toBeFalsy();
        expect(errors).toBeTruthy();

        expect(errors!.length).toEqual(1);
        expect(errors![0].message.toLowerCase()).toContain("invalid emoji");
    });
});
