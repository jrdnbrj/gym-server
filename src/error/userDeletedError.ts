import { ApolloError } from "apollo-server-core";

export const userDeletedError = new ApolloError(
    "El usuario ya no existe. Por favor, inicie sesión de nuevo."
);
