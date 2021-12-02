import { Entity, OneToMany, PrimaryGeneratedColumn, Column } from "typeorm";
import { ObjectType, Field, ID } from "type-graphql";
import { WeekSchedule } from "./WeekSchedule";

@ObjectType()
@Entity()
export class Instructor {
    @Field()
    @PrimaryGeneratedColumn()
    id!: number;

    @Field()
    @Column()
    userID!: number;

    @Field(() => [ID])
    @Column("int", { array: true, default: [] })
    weekScheduleIDs!: number[];

    @OneToMany(() => WeekSchedule, (weekSchedule) => weekSchedule.instructor)
    weekSchedules!: WeekSchedule[];
}
