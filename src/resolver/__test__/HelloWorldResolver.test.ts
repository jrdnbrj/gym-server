import gql from "graphql-tag";
import { getConnection } from "typeorm";
import { testDb } from "../../../test/testDb";
import { gCall } from "../../../test/util/gCall";

beforeAll(async () => {
    await testDb(false);
});

afterAll(async () => {
    await getConnection().close();
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
