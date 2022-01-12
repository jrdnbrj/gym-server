import {
    BaseEntity,
    Column,
    Entity,
    OneToOne,
    PrimaryGeneratedColumn,
} from "typeorm";
import { ObjectType, Field, ID } from "type-graphql";
import { User } from "./User";

@Entity()
@ObjectType()
export class Client extends BaseEntity {
    @PrimaryGeneratedColumn()
    id!: number;

    @OneToOne(() => User, (user) => user.client)
    user!: Promise<User>;

    // FIXME: this shouldn't be a column
    @Field(() => [ID])
    @Column("int", { array: true, default: [] })
    weekScheduleIDs!: number[];
}
