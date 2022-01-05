import { User } from "../../../entity/User";

export const newClientFields: Partial<User> = {
    isClient: true,
    client: {
        weekScheduleIDs: [],
    },
};

export const newInstructorFields: Partial<User> = {
    isInstructor: true,
    instructor: {
        weekSchedules: [],
    },
};

export const newAdminFields: Partial<User> = {
    isAdmin: true,
    admin: {
        _placeholder: "debugging",
    },
};

export const newFullPrivilegeUserFields: Partial<User> = {
    ...newClientFields,
    ...newInstructorFields,
    ...newAdminFields,
};

// Not-roles
export const newNonClientFields: Partial<User> = {
    isClient: false,
    client: null as any,
};

export const newNonInstructorFields: Partial<User> = {
    isInstructor: false,
    instructor: null as any,
};

export const newNonAdminFields: Partial<User> = {
    isAdmin: false,
    admin: null as any,
};

export const newNoPrivilegeUserFields: Partial<User> = {
    ...newNonClientFields,
    ...newNonInstructorFields,
    ...newNonAdminFields,
};

// Generator
export const newUserRoleFields = ({
    isClient,
    isInstructor,
    isAdmin,
}: {
    isInstructor: boolean;
    isClient: boolean;
    isAdmin: boolean;
}): Partial<User> => {
    let fields: { [key: string]: any } = {};

    if (isClient) fields = { ...fields, ...newClientFields };
    else fields = { ...fields, ...newNonClientFields };

    if (isInstructor) fields = { ...fields, ...newInstructorFields };
    else fields = { ...fields, ...newNonInstructorFields };

    if (isAdmin) fields = { ...fields, ...newAdminFields };
    else fields = { ...fields, ...newNonAdminFields };

    return fields;
};
