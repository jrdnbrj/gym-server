import gql from "graphql-tag";
import { allUserFields } from "../fragment/allUserFields";

export const adminUserRolesMutation = gql`
    mutation AdminUserRoles(
        $userID: ID!
        $isClient: Boolean
        $isInstructor: Boolean
        $isAdmin: Boolean
    ) {
        adminUserRoles(
            userID: $userID
            isClient: $isClient
            isInstructor: $isInstructor
            isAdmin: $isAdmin
        ) {
            ...allUserFields
        }
    }

    ${allUserFields}
`;
