import { Min } from "class-validator";
import { ArgsType, Field, ID } from "type-graphql";
import { Weekday } from "../../enum/Weekday";

@ArgsType()
export class WeekScheduleChangeInstructorArgs {
    @Field(() => ID)
    weekScheduleID!: string;

    @Field(() => ID)
    instructorID!: string;
}

@ArgsType()
export class WeekScheduleEditArgs {
    @Field(() => ID)
    weekScheduleID!: string;

    @Field({ nullable: true })
    @Min(0)
    price?: number;

    @Field({ nullable: true })
    workoutTypeName?: string;

    @Field(() => [Weekday], { nullable: true })
    days?: Weekday[];

    @Field({ nullable: true })
    startDate?: Date;
}
