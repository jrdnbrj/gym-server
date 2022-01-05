import { graphql, GraphQLSchema, Source } from "graphql";
import { Maybe } from "type-graphql";
import { RegularContext } from "../../src/types/RegularContext";
import { buildGqlSchema } from "../../src/util/buildGqlSchema";

interface Options {
    source: string | Source;
    variableValues?: Maybe<{ [key: string]: any }>;
    contextValue?: Partial<RegularContext>;
}

let schema: GraphQLSchema;

export const gCall = async ({
    source,
    variableValues,
    contextValue,
}: Options) => {
    if (!schema) {
        schema = await buildGqlSchema();
    }

    return graphql({
        schema,
        source,
        variableValues,
        contextValue,
    });
};
