import gql from "graphql-tag";

export const workoutTypeDeleteMutation = gql`
    mutation WorkoutTypeDelete($name: String!) {
        workoutTypeDelete(name: $name)
    }
`;
