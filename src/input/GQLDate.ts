import { Field, Int, InputType } from "type-graphql";

@InputType()
export class DateInput {
    @Field(() => Int)
    day!: number;

    @Field(() => Int)
    month!: number;

    @Field(() => Int)
    year!: number;

    @Field(() => Int)
    hours!: number;

    @Field(() => Int)
    minutes!: number;
}
