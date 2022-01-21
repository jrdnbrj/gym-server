import gql from "graphql-tag";

export const adminSubmitPaymentMutation = gql`
    mutation AdminSubmitPayment(
        $weekScheduleID: ID!
        $clientID: ID!
        $months: Int
    ) {
        adminSubmitPayment(
            weekScheduleID: $weekScheduleID
            clientID: $clientID
            months: $months
        ) {
            id
            transactionDate
            clientID
            clientEmail
            weekScheduleID
            workoutTypeName
            paidForMonthsDates
            totalAmount
        }
    }
`;
