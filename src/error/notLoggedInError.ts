import { ApolloError } from "apollo-server-core";

export const notLoggedInError = new ApolloError("Por favor inicie sesión.");
