import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    ManyToMany,
    ManyToOne,
    JoinTable,
    BaseEntity,
} from "typeorm";
import { ObjectType, Field } from "type-graphql";
import { Weekday } from "../enum/Weekday";
import { User } from "./User";
import { WorkoutType } from "./WorkoutType";
import { Instructor } from "./Instructor";

@ObjectType()
@Entity()
export class WeekSchedule extends BaseEntity {
    @Field()
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => WorkoutType, { onDelete: "CASCADE" })
    workoutType!: Promise<WorkoutType>;

    @Field(() => WorkoutType, { name: "workoutType" })
    _workoutTypeField!: WorkoutType;

    // TODO: create custom field resolver for quotas.
    @Field()
    @Column({ default: 3 })
    quotas!: number;

    @Field(() => [User], { nullable: true })
    @ManyToMany(() => User, { eager: true })
    @JoinTable()
    students!: User[];

    @ManyToOne(() => Instructor, (instructor) => instructor.weekSchedules)
    instructor!: Promise<Instructor>;

    /**Returns the instructor's user object, not the instructor object itself.*/
    @Field(() => User, { name: "instructor" })
    _instructorField!: User;

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
