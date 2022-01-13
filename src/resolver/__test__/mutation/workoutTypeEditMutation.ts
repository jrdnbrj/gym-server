import gql from "graphql-tag";

export const workoutTypeEditMutation = gql`
    mutation WorkoutTypeEdit(
        $originalName: String!
        $newName: String
        $newEmoji: String
    ) {
        workoutTypeEdit(
            originalName: $originalName
            newName: $newName
            newEmoji: $newEmoji
        ) {
            name
            emoji
        }
    }
`;
