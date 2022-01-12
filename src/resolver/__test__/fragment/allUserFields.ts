import gql from "graphql-tag";

export const allUserFields = gql`
    fragment allUserFields on User {
        id
        firstName
        lastName
        email
        password
        isClient
        client {
            weekSchedules {
                id
            }
        }
        isInstructor
        instructor {
            weekSchedules {
                id
            }
        }
        isAdmin
        admin {
            _placeholder
        }
    }
`;
