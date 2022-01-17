import { ArgsType, Field, ID } from "type-graphql";

@ArgsType()
export class WeekScheduleRemoveArgs {
    @Field(() => ID)
    weekScheduleID!: string;

    @Field(() => ID)
    instructorID!: string;
}
