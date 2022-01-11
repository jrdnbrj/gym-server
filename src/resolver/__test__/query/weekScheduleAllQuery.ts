import gql from "graphql-tag";

export const weekScheduleAllQuery = gql`
    query WeekScheduleAll {
        weekScheduleAll {
            id
            workoutType {
                name
                emoji
            }
            quotas
            students {
                id
            }
            instructor {
                id
            }
            days
            startDate
        }
    }
`;
