import { ArgsType, Field, ID } from "type-graphql";

@ArgsType()
export class ClientHasPaidForWeekScheduleArgs {
    @Field(() => ID)
    weekScheduleID!: string;

    @Field(() => ID)
    clientID!: string;

    /**The query returns true if the client has already paid for this aregument's month-year (in the given weekSchedule). It defaults to the current date.*/
    @Field({ nullable: true })
    monthDate?: Date;
}
