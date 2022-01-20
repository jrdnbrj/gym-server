import { Min } from "class-validator";
import { ArgsType, Field, ID, Int } from "type-graphql";

@ArgsType()
export class AdminSubmitPaymentArgs {
    @Field(() => ID)
    clientID!: string;

    @Field(() => ID)
    weekScheduleID!: string;

    /**Number of months to pay for. Defaults to one.*/
    @Field(() => Int, { nullable: true })
    @Min(1)
    months?: number;
}
