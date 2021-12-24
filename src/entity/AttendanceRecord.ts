import { Entity, PrimaryGeneratedColumn, ManyToOne, Column } from "typeorm";
import { ObjectType, Field } from "type-graphql";
import { WeekSchedule } from "./WeekSchedule";

@ObjectType()
export class AttendanceUnit {
    @Field()
    studentID!: number;

    @Field()
    attended!: boolean;
}

@Entity()
@ObjectType()
export class AttendanceRecord {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => WeekSchedule, { eager: true, onDelete: "CASCADE" })
    @Field(() => WeekSchedule)
    weekSchedule!: WeekSchedule;

    @Column({ type: "timestamptz" })
    @Field()
    date!: Date;

    // Weird: https://stackoverflow.com/questions/59437390/typeorm-jsonb-array-column
    @Column({ type: "jsonb", array: false, default: () => "'[]'" })
    attendance!: Array<{ studentID: number; attended: boolean }>;

    @Field(() => [AttendanceUnit], { name: "attendance" })
    attendanceField!: AttendanceUnit[];
}
