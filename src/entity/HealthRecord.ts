import { Field, Float, Int, ObjectType } from "type-graphql";
import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
} from "typeorm";
import { Client } from "./Client";
import { Instructor } from "./Instructor";
import { User } from "./User";

@ObjectType()
@Entity()
export class HealthRecord extends BaseEntity {
    @Field()
    @PrimaryGeneratedColumn()
    id!: number;

    @Field()
    @CreateDateColumn({ type: "timestamptz" })
    takenAt!: Date;

    @ManyToOne(() => Instructor, { onDelete: "SET NULL" })
    takenBy!: Promise<Instructor | null>;

    @Field(() => User, { name: "takenBy", nullable: true })
    _takenByField!: User | null;

    @ManyToOne(() => Client, (c) => c.healthRecords, { onDelete: "CASCADE" })
    client!: Promise<Client>;

    @Field(() => User, { name: "client" })
    _clientField!: User;

    // Data
    /**Weight in kilograms.*/
    @Column("decimal")
    @Field(() => Float)
    weight!: number;

    /**Height in meters.*/
    @Column("decimal")
    @Field(() => Float)
    height!: number;

    /**Pulse in beats per minute (bpm).*/
    @Column("smallint")
    @Field(() => Int)
    pulse!: number;

    /**Systolic blood pressure in mmHg. First number in a blood pressure string (eg. 120 in "120/80").*/
    @Column("smallint")
    @Field(() => Int)
    systolicPressure!: number;

    /**Diastolic blood pressure in mmHg. Second number in a blood pressure string (eg. 80 in "120/80").*/
    @Column("smallint")
    @Field(() => Int)
    diastolicPressure!: number;
}
