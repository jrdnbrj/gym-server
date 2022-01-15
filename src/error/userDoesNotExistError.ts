import { ApolloError } from "apollo-server-core";

export const userDoesNotExistError = new ApolloError("Usuario no existe.");
