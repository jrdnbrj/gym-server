import gql from "graphql-tag";
import { allUserFields } from "../fragment/allUserFields";

export const userMeQuery = gql`
    query UserMeQuery {
        userMe {
            ...allUserFields
        }
    }

    ${allUserFields}
`;
