import gql from "graphql-tag";

export const weekScheduleRemove = gql`
    mutation WeekScheduleRemove($weekScheduleID: ID!) {
        weekScheduleRemove(weekScheduleID: $weekScheduleID)
    }
`;
