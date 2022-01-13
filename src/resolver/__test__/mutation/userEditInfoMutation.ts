import gql from "graphql-tag";
import { allUserFields } from "../fragment/allUserFields";

export const userEditInfoMutation = gql`
    mutation UserEditInfo(
        $firstName: String!
        $lastName: String!
        $email: String!
    ) {
        userEditInfo(
            firstName: $firstName
            lastName: $lastName
            email: $email
        ) {
            ...allUserFields
        }
    }

    ${allUserFields}
`;
