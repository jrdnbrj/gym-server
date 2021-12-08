import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    ManyToMany,
    ManyToOne,
    JoinTable,
} from "typeorm";
import { ObjectType, Field } from "type-graphql";
import { Client } from "./Client";
import { Instructor } from "./Instructor";
import { Weekday } from "../enum/Weekday";
import WorkoutType from "../enum/WorkoutType";

@ObjectType()
@Entity()
export class WeekSchedule {
    @Field()
    @PrimaryGeneratedColumn()
    id!: number;

    @Field(() => WorkoutType)
    @Column({ type: "enum", enum: "enum", default: WorkoutType.Stength })
    workoutType!: WorkoutType;

    @Field()
    @Column({ default: 3 })
    quotas!: number;

    @Field(() => [Client], { nullable: true })
    @ManyToMany(() => Client, { eager: true })
    @JoinTable()
    students!: Client[];

    @Field(() => Instructor)
    @ManyToOne(() => Instructor, (instructor) => instructor.weekSchedules, {
        eager: true,
    })
    instructor!: Instructor;

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

    constructor(
        instructor: Instructor,
        days: Weekday[],
        startDate: Date,
        workoutType: WorkoutType
    ) {
        this.instructor = instructor;
        this.days = days;
        this.startDate = startDate;
        this.workoutType = workoutType;
    }
}
