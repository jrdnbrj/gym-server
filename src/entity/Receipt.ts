import { Field, ID, ObjectType } from "type-graphql";
import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
} from "typeorm";

@Entity()
@ObjectType()
export class Receipt extends BaseEntity {
    @PrimaryGeneratedColumn("uuid")
    @Field(() => ID)
    id!: string;

    @CreateDateColumn({ name: "transaction_date" })
    @Field()
    transactionDate!: Date;

    /**Corresponds to the client's userID at the moment of the transaction. Thus, it is not guaranteed the user still exists when reading the receipt.*/
    @Column("uuid")
    @Field(() => ID)
    clientID!: string;

    /**Corresponds to the client's email at the moment of the transaction. Thus, it is not guaranteed the user still exists or that the email is the same.
     *
     * This field shouldn't be used as user identification. Use clientID instead.*/
    @Column()
    @Field()
    clientEmail!: string;

    /**Corresponds to the paid for weekSchedule's id at the moment of the transaction. Thus, it is not guaranteed the weekSchedule still exists when reading this receipt.*/
    @Column()
    @Field()
    weekScheduleID!: string;

    /**weekSchedule's workoutType's name at the moment of transaction.*/
    @Column()
    @Field()
    workoutTypeName!: string;

    /**Dates whose months and years represent the ones paid for in the receipt.*/
    @Column("date", { array: true })
    @Field(() => [Date])
    paidForMonthsDates!: Date[];

    /**Total amount of the transaction, in dollars.*/
    @Column("decimal")
    @Field()
    totalAmount!: number;
}
