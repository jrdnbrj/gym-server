import { Entity, Column, PrimaryGeneratedColumn, BaseEntity } from "typeorm";
import { ObjectType, Field, registerEnumType } from "type-graphql";

export enum Weekdays {
    Monday = "Monday",
    Tuesday = "Tuesday",
    Wednesday = "Wednesday",
    Thursday = "Thursday",
    Friday = "Friday",
    Saturday = "Saturday",
    Sunday = "Sunday"
}

registerEnumType(Weekdays, {
    name: "Weekdays",
    description: "Weekdays"
});

@ObjectType()
@Entity()
export class MonthlyClasses extends BaseEntity {
    @Field()
    @PrimaryGeneratedColumn()
    id!: number;

    @Field()
    @Column()
    quotas!: number;

    @Field()
    @Column()
    student!: string;

    @Field()
    @Column()
    instructor!: string;

    @Field(() => Weekdays)
    @Column({
        type: "enum",
        enum: Weekdays,
    })
    day!: Weekdays;

    @Field()
    @Column('time')
    time!: string;
}
