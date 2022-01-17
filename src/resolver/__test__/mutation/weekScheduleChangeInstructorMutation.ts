import gql from "graphql-tag";

export const weekScheduleChangeInstructorMutation = gql`
    mutation WeekScheduleChangeInstructor(
        $weekScheduleID: ID!
        $instructorID: ID!
    ) {
        weekScheduleChangeInstructor(
            weekScheduleID: $weekScheduleID
            instructorID: $instructorID
        ) {
            instructor {
                id
            }
        }
    }
`;
