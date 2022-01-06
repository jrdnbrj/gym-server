import gql from "graphql-tag";

export const workoutTypeCreateMutation = gql`
    mutation WorkoutTypeCreateMutation($name: String!, $emoji: String!) {
        workoutTypeCreate(name: $name, emoji: $emoji) {
            name
            emoji
        }
    }
`;
