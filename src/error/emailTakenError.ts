import { ApolloError } from "apollo-server-core";

export const emailTakenError = new ApolloError(
    "Email en uso. Ocupe otro email."
);
