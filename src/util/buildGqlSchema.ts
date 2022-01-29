import { buildSchema } from "type-graphql";
import * as path from "path";

export const buildGqlSchema = () => {
    return buildSchema({
        resolvers: [
            path.join(__dirname, "..", "resolver", "*.ts"),
            path.join(__dirname, "..", "resolver", "*.js"),
        ],
    });
};
