import { OneToMany } from "typeorm";
import { ObjectType, Field } from "type-graphql";
import { WeekSchedule } from "./WeekSchedule";

@ObjectType()
export class Instructor {
    // TODO: should not be field??
    @Field(() => [WeekSchedule])
    @OneToMany(() => WeekSchedule, (weekSchedule) => weekSchedule.instructor)
    weekSchedules: WeekSchedule[] = [];
}
