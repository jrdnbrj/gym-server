import gql from "graphql-tag";
import { Connection } from "typeorm";
import { testDb } from "../../../test/testDb";
import { gCall } from "../../../test/util/gCall";

let db: Connection;

beforeAll(async () => {
    db = await testDb(false);
});

afterAll(async () => {
    await db.close();
});

describe("HelloWorldResolver tests", () => {
    test("helloWorld query", async () => {
        const helloQuery = gql`
            {
                helloWorld
            }
        `;

        const { data } = await gCall({
            source: helloQuery.loc!.source,
            variableValues: {},
        });

        expect(data).toBeDefined();
        expect(data!.helloWorld).toEqual("Hello World!");
    });
});
