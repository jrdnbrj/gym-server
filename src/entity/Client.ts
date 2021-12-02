import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";
import { ObjectType, Field, ID } from "type-graphql";

@ObjectType()
@Entity()
export class Client {
    @Field()
    @PrimaryGeneratedColumn()
    id!: number;

    @Field()
    @Column()
    userID!: number;

    @Field(() => [ID])
    @Column("int", { array: true, default: [] })
    weekScheduleIDs!: number[];
}
