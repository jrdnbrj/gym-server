import { getConnection } from "typeorm";
import { testDb } from "../../../test/testDb";
import { WorkoutType } from "../../entity/WorkoutType";
import { workoutTypeAllQuery } from "./query/workoutTypeAllQuery";
import { gCallExpectNoErrors } from "./util/gCallExpect";
import * as faker from "faker";
import { randomEmoji } from "../../../test/util/randomEmoji";
import { workoutTypeCreateMutation } from "./mutation/workoutTypeCreateMutation";
import { gCall } from "../../../test/util/gCall";
import { genDbWorkoutType } from "../../../test/util/genDbWorkoutType";
import { randomUUID } from "crypto";
import { workoutTypeEditMutation } from "./mutation/workoutTypeEditMutation";
import {
    invalidEmojiError,
    workoutTypeEmojiTakenError,
    workoutTypeNameTakenError,
    workoutTypeNotFoundError,
    workoutTypeReferencedError,
} from "../WorkoutTypeResolver";
import { workoutTypeDeleteMutation } from "./mutation/workoutTypeDeleteMutation";
import { genDbWeekSchedule } from "../../../test/util/genDbWeekSchedule";
import { WeekSchedule } from "../../entity/WeekSchedule";

beforeAll(async () => {
    await testDb(false);
});

afterAll(async () => {
    await getConnection().close();
});

describe("workoutTypeAll query", () => {
    test("on empty db", async () => {
        await WorkoutType.delete({});

        const data = await gCallExpectNoErrors(workoutTypeAllQuery);

        expect(data).toBeTruthy();
        expect(data.workoutTypeAll).toEqual([]);
    });

    test("with random WorkoutTypes", async () => {
        await WorkoutType.delete({});

        const testTypes: WorkoutType[] = [];

        // Random n between 25 and 50.
        const n = Math.random() * 25 + 25;
        for (let i = 0; i < n; i++) {
            testTypes.push(await genDbWorkoutType());
        }

        // Query
        const data = await gCallExpectNoErrors(workoutTypeAllQuery);
        expect(data.workoutTypeAll).toBeTruthy();

        for (const wType of testTypes) {
            expect(data.workoutTypeAll).toContainEqual({
                name: wType.name,
                emoji: wType.emoji,
            });
        }
    });
});

describe("workoutTypeCreate mutation", () => {
    it("should successfully create and save a new WorkoutType", async () => {
        const newTypeInfo = await genDbWorkoutType(false);

        // Query
        const data = await gCallExpectNoErrors(workoutTypeCreateMutation, {
            variableValues: newTypeInfo,
        });

        const result = data.workoutTypeCreate;
        expect(result).toBeTruthy();

        expect(result).toEqual(newTypeInfo);
    });

    it("should fail when using a duplicate name", async () => {
        const oldType = await genDbWorkoutType();

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
        expect(errors![0].message.toLowerCase()).toContain("con ese nombre");
    });

    it("should fail when using a duplicate emoji", async () => {
        const oldType = await genDbWorkoutType();

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
        expect(errors![0].message.toLowerCase()).toContain("mismo emoji");
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
        expect(errors![0].message.toLowerCase()).toContain("emoji válido");
    });
});

describe("workoutTypeEdit mutation", () => {
    it("should successfully change its name and emoji", async () => {
        const wt = await genDbWorkoutType();

        let newName = randomUUID();
        let newEmoji = randomEmoji();

        // While newName and newEmoji are not unique
        while (
            (await WorkoutType.findOne({ name: newName })) ||
            newName == wt.name
        ) {
            newName = randomUUID();
        }

        while (
            (await WorkoutType.findOne({ emoji: newEmoji })) ||
            newEmoji == wt.emoji
        ) {
            newEmoji = randomEmoji();
        }

        // Mutation
        const data = await gCallExpectNoErrors(workoutTypeEditMutation, {
            variableValues: {
                originalName: wt.name,
                newName,
                newEmoji,
            },
        });

        const result = data.workoutTypeEdit;
        expect(result).toBeTruthy();

        expect(result).toMatchObject({
            name: newName,
            emoji: newEmoji,
        });

        // Test db object
        const dbWt = await WorkoutType.findOne({ name: newName });

        expect(dbWt).toBeDefined();
        expect(dbWt!.emoji).toEqual(newEmoji);
    });

    it("should successfully change only its name", async () => {
        const wt = await genDbWorkoutType();

        let newName = randomUUID();

        // While newName is not unique
        while (
            (await WorkoutType.findOne({ name: newName })) ||
            newName == wt.name
        ) {
            newName = randomUUID();
        }

        // Mutation
        const data = await gCallExpectNoErrors(workoutTypeEditMutation, {
            variableValues: {
                originalName: wt.name,
                newName,
            },
        });

        const result = data.workoutTypeEdit;
        expect(result).toBeTruthy();

        expect(result).toMatchObject({
            name: newName,
            emoji: wt.emoji,
        });

        // Test db object
        const dbWt = await WorkoutType.findOne({ name: newName });

        expect(dbWt).toBeDefined();
        expect(dbWt!.emoji).toEqual(wt.emoji);
    });

    it("should successfully change only its emoji", async () => {
        const wt = await genDbWorkoutType();

        let newEmoji = randomEmoji();

        // While newEmoji is not unique
        while (
            (await WorkoutType.findOne({ emoji: newEmoji })) ||
            newEmoji == wt.emoji
        ) {
            newEmoji = randomEmoji();
        }

        // Mutation
        const data = await gCallExpectNoErrors(workoutTypeEditMutation, {
            variableValues: {
                originalName: wt.name,
                newEmoji,
            },
        });

        const result = data.workoutTypeEdit;
        expect(result).toBeTruthy();

        expect(result).toMatchObject({
            name: wt.name,
            emoji: newEmoji,
        });

        // Test db object
        const dbWt = await WorkoutType.findOne({ name: wt.name });

        expect(dbWt).toBeDefined();
        expect(dbWt!.emoji).toEqual(newEmoji);
    });

    it("should return the same WorkoutType when no new info is given", async () => {
        const wt = await genDbWorkoutType();

        // Mutation
        const data = await gCallExpectNoErrors(workoutTypeEditMutation, {
            variableValues: {
                originalName: wt.name,
            },
        });

        const result = data.workoutTypeEdit;
        expect(result).toBeTruthy();

        expect(result).toMatchObject({
            name: wt.name,
            emoji: wt.emoji,
        });

        // Test db object
        const dbWt = await WorkoutType.findOne({ name: wt.name });

        expect(dbWt).toBeDefined();
        expect(dbWt!.emoji).toEqual(wt.emoji);
    });

    it("should throw an error when given a non-existent originalName", async () => {
        let wrongName = randomUUID();
        while (await WorkoutType.findOne({ name: wrongName })) {
            wrongName = randomUUID();
        }

        // Mutation
        const { data, errors } = await gCall({
            source: workoutTypeEditMutation.loc!.source,
            variableValues: {
                originalName: wrongName,
            },
        });

        expect(data).toBeFalsy();
        expect(errors).toBeTruthy();

        expect(errors!.length).toEqual(1);
        expect(errors![0].message).toEqual(workoutTypeNotFoundError.message);
    });

    it("should throw an error when given a taken newName", async () => {
        const constWt = await genDbWorkoutType();
        const mutWt = await genDbWorkoutType();

        // Mutation
        const { data, errors } = await gCall({
            source: workoutTypeEditMutation.loc!.source,
            variableValues: {
                originalName: mutWt.name,
                newName: constWt.name,
            },
        });

        expect(data).toBeFalsy();
        expect(errors).toBeTruthy();

        expect(errors!.length).toEqual(1);
        expect(errors![0].message).toEqual(workoutTypeNameTakenError.message);
    });

    it("should throw an error when given a taken newEmoji", async () => {
        const constWt = await genDbWorkoutType();
        const mutWt = await genDbWorkoutType();

        // Mutation
        const { data, errors } = await gCall({
            source: workoutTypeEditMutation.loc!.source,
            variableValues: {
                originalName: mutWt.name,
                newEmoji: constWt.emoji,
            },
        });

        expect(data).toBeFalsy();
        expect(errors).toBeTruthy();

        expect(errors!.length).toEqual(1);
        expect(errors![0].message).toEqual(workoutTypeEmojiTakenError.message);
    });

    it("should throw an error when given an invalid newEmoji", async () => {
        const wt = await genDbWorkoutType();

        // Mutation
        const { data, errors } = await gCall({
            source: workoutTypeEditMutation.loc!.source,
            variableValues: {
                originalName: wt.name,
                newEmoji: "not emoji",
            },
        });

        expect(data).toBeFalsy();
        expect(errors).toBeTruthy();

        expect(errors!.length).toEqual(1);
        expect(errors![0].message).toEqual(invalidEmojiError.message);
    });
});

describe("workoutTypeDelete mutation", () => {
    it("should successfully delete a WorkoutType", async () => {
        const { name } = await genDbWorkoutType();

        const data = await gCallExpectNoErrors(workoutTypeDeleteMutation, {
            variableValues: {
                name,
            },
        });

        const result = data.workoutTypeDelete;
        expect(result).toBeDefined();
        expect(result).toEqual(true);

        // Check db
        expect(await WorkoutType.findOne({ name })).toBeUndefined();
    });

    it("should throw an error given a non-existent WorkoutType", async () => {
        let name = randomUUID();
        while (await WorkoutType.findOne({ name })) name = randomUUID();

        const { data, errors } = await gCall({
            source: workoutTypeDeleteMutation.loc!.source,
            variableValues: {
                name,
            },
        });

        expect(data).toBeFalsy();
        expect(errors).toBeTruthy();

        expect(errors!.length).toEqual(1);
        expect(errors![0].message).toEqual(workoutTypeNotFoundError.message);
    });

    it("should throw an error given a referenced WorkoutType", async () => {
        const wt = await genDbWorkoutType();
        const ws = await genDbWeekSchedule({ workoutType: wt });

        const { data, errors } = await gCall({
            source: workoutTypeDeleteMutation.loc!.source,
            variableValues: {
                name: wt.name,
            },
        });

        expect(data).toBeFalsy();
        expect(errors).toBeTruthy();

        expect(errors!.length).toEqual(1);
        expect(errors![0].message).toEqual(workoutTypeReferencedError.message);

        // Assert db is unchanged
        expect(await WorkoutType.findOne(wt.id)).toBeDefined();
        expect(await WeekSchedule.findOne(ws.id)).toBeDefined();
    });
});
