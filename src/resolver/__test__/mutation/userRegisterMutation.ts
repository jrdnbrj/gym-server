import { gql } from "graphql-tag";
import { allUserFields } from "../fragment/allUserFields";

export const userRegisterMutation = gql`
    mutation UserRegisterMutation(
        $firstName: String!
        $lastName: String!
        $email: String!
        $password: String!
        $isClient: Boolean!
        $isInstructor: Boolean!
        $isAdmin: Boolean!
    ) {
        userRegister(
            firstName: $firstName
            lastName: $lastName
            email: $email
            password: $password
            isClient: $isClient
            isInstructor: $isInstructor
            isAdmin: $isAdmin
        ) {
            ...allUserFields
        }
    }

    ${allUserFields}
`;
