import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    ManyToMany,
    ManyToOne,
    JoinTable,
} from "typeorm";
import { ObjectType, Field } from "type-graphql";
import { Weekday } from "../enum/Weekday";
import WorkoutType from "../enum/WorkoutType";
import { User } from "./User";

@ObjectType()
@Entity()
export class WeekSchedule {
    @Field()
    @PrimaryGeneratedColumn()
    id!: number;

    @Field(() => WorkoutType)
    @Column({ type: "enum", enum: WorkoutType, default: WorkoutType.Stength })
    workoutType!: WorkoutType;

    // TODO: create custom field resolver for quotas.
    @Field()
    @Column({ default: 3 })
    quotas!: number;

    @Field(() => [User], { nullable: true })
    @ManyToMany(() => User, { eager: true })
    @JoinTable()
    students!: User[];

    @Field(() => User)
    @ManyToOne(() => User, (user) => user.instructor!.weekSchedules, {
        eager: true,
    })
    instructor!: User;

    @Field(() => [Weekday])
    @Column({
        type: "enum",
        array: true,
        enum: Weekday,
        default: [],
    })
    days!: Weekday[];

    @Field()
    @Column({ type: "timestamptz" })
    startDate!: Date;
}
