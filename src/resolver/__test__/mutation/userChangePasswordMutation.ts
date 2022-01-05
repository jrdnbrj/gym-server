import gql from "graphql-tag";

export const userChangePasswordMutation = gql`
    mutation UserChangePasswordMutation(
        $token: String!
        $newPassword: String!
    ) {
        userChangePassword(token: $token, newPassword: $newPassword)
    }
`;
