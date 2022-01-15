import { ApolloError } from "apollo-server-core";

export const notEnoughPrivilegesError = new ApolloError(
    "Usuario no tiene suficientes privilegios."
);
