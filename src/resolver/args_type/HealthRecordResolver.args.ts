import { Min } from "class-validator";
import { ArgsType, Field, Float, ID, Int } from "type-graphql";

@ArgsType()
export class HealthRecordCreateArgs {
    @Field(() => ID)
    clientID!: string;

    /**Weight in kg.*/
    @Field(() => Float)
    @Min(0)
    weight!: number;

    /**Height in m.*/
    @Field(() => Float)
    @Min(0)
    height!: number;

    /**Pulse in beats-per-minute (bpm)..*/
    @Field(() => Int)
    @Min(0)
    pulse!: number;

    /**Systolic blood pressure in mmHg. First number in a blood pressure string (eg. 120 in "120/80").*/
    @Field(() => Int)
    @Min(0)
    systolicPressure!: number;

    /**Diastolic blood pressure in mmHg. Second number in a blood pressure string (eg. 80 in "120/80").*/
    @Field(() => Int)
    @Min(0)
    diastolicPressure!: number;
}
