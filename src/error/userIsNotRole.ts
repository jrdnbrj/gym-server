import { ApolloError } from "apollo-server-core";

const errorMessage = (role: string) =>
    new ApolloError(`Usuario no es un ${role}.`);

export const userIsNotClientError = errorMessage("cliente");
export const userIsNotInstructorError = errorMessage("instructor");
export const userIsNotAdminError = errorMessage("administrador");
