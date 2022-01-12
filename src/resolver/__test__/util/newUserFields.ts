import { User } from "../../../entity/User";

export const newClientFields = {
    isClient: true,
    client: {
        weekScheduleIDs: [],
    },
};

export const newInstructorFields = {
    isInstructor: true,
    instructor: {
        weekSchedules: [],
    },
};

export const newAdminFields = {
    isAdmin: true,
    admin: {
        _placeholder: "debugging",
    },
};

export const newFullPrivilegeUserFields = {
    ...newClientFields,
    ...newInstructorFields,
    ...newAdminFields,
};

// Not-roles
export const newNonClientFields = {
    isClient: false,
    client: null,
};

export const newNonInstructorFields = {
    isInstructor: false,
    instructor: null,
};

export const newNonAdminFields = {
    isAdmin: false,
    admin: null,
};

export const newNoPrivilegeUserFields = {
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
