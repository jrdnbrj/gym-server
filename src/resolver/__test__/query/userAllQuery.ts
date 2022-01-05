import gql from "graphql-tag";
import { allUserFields } from "../fragment/allUserFields";

export const userAllQuery = gql`
    query UserAllQuery {
        userAll {
            ...allUserFields
        }
    }

    ${allUserFields}
`;
