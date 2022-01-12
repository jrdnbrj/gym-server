import {
    BaseEntity,
    Entity,
    OneToMany,
    OneToOne,
    PrimaryGeneratedColumn,
} from "typeorm";
import { ObjectType, Field } from "type-graphql";
import { WeekSchedule } from "./WeekSchedule";
import { User } from "./User";

@Entity()
@ObjectType()
export class Instructor extends BaseEntity {
    @PrimaryGeneratedColumn()
    id!: number;

    @OneToOne(() => User, (user) => user.instructor)
    user!: Promise<User>;

    @OneToMany(() => WeekSchedule, (weekSchedule) => weekSchedule.instructor)
    weekSchedules!: Promise<WeekSchedule[]>;

    @Field(() => [WeekSchedule], { name: "weekSchedules" })
    _weekSchedulesField!: WeekSchedule[];
}
