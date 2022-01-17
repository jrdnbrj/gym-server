import { ArgsType, Field, ID } from "type-graphql";

@ArgsType()
export class WeekScheduleChangeInstructorArgs {
    @Field(() => ID)
    weekScheduleID!: string;

    @Field(() => ID)
    instructorID!: string;
}
