import gql from "graphql-tag";
import { allUserFields } from "../fragment/allUserFields";

export const userLoginMutation = gql`
    mutation UserLoginMutation($email: String!, $password: String!) {
        userLogin(email: $email, password: $password) {
            ...allUserFields
        }
    }

    ${allUserFields}
`;
