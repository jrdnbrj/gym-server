import gql from "graphql-tag";

export const userLogoutMutation = gql`
    mutation UserLogoutMutation {
        userLogout
    }
`;
