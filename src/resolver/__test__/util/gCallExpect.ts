import { DocumentNode } from "graphql";
import { gCall } from "../../../../test/util/gCall";
import { User } from "../../../entity/User";
import { RegularContext } from "../../../types/RegularContext";
import {
    newFullPrivilegeUserFields,
    newNoPrivilegeUserFields,
} from "./newUserFields";

interface gCallExpectOptions {
    variableValues?: { [key: string]: any };
    context?: Partial<RegularContext>;
}

/**Calls an operation using gCall and expects no errors. Returns a `data` object.*/
export const gCallExpectNoErrors = async (
    operation: DocumentNode,
    { context, variableValues }: gCallExpectOptions = {}
) => {
    const { data, errors } = await gCall({
        source: operation.loc!.source,
        contextValue: context,
        variableValues,
    });

    expect(errors).toBeFalsy();
    expect(data).toBeTruthy();

    return data!;
};

/**Calls an operation using gCall and expects no errors and a full-privilege User object as a result.*/
export const gCallExpectFullPrivilegeUser = async (
    operation: DocumentNode,
    operationName: string,
    user: User,
    options: gCallExpectOptions
) => {
    const data = await gCallExpectNoErrors(operation, options);

    expect(data[operationName]).toMatchObject({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        ...newFullPrivilegeUserFields,
    });

    return data;
};

/**Calls an operation using gCall and expects no errors and a no-privilege User object as a result.*/
export const gCallExpectNoPrivilegeUser = async (
    operation: DocumentNode,
    operationName: string,
    user: User,
    options: gCallExpectOptions
) => {
    const data = await gCallExpectNoErrors(operation, options);

    expect(data[operationName]).toMatchObject({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        ...newNoPrivilegeUserFields,
    });

    return data;
};
