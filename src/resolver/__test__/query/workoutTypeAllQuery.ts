import gql from "graphql-tag";

export const workoutTypeAllQuery = gql`
    query WorkoutTypeAll {
        workoutTypeAll {
            name
            emoji
        }
    }
`;
