import { gql } from "graphql-tag";
import { allUserFields } from "../fragment/allUserFields";

export const userByIdQuery = gql`
    query UserByID($userID: ID!) {
        userByID(userID: $userID) {
            ...allUserFields
        }
    }

    ${allUserFields}
`;
