import { Column } from "typeorm";
import { ObjectType, Field, ID } from "type-graphql";

@ObjectType()
export class Client {
    @Field(() => [ID])
    @Column("int", { array: true, default: [] })
    weekScheduleIDs!: number[];
}
