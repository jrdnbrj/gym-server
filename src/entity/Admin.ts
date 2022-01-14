import { ObjectType, Field } from "type-graphql";
import {
    BaseEntity,
    Column,
    Entity,
    OneToOne,
    PrimaryGeneratedColumn,
} from "typeorm";
import { User } from "./User";

@Entity()
@ObjectType()
class Admin extends BaseEntity {
    @PrimaryGeneratedColumn()
    id!: number;

    @OneToOne(() => User, (user) => user.admin, { onDelete: "CASCADE" })
    user!: Promise<User>;

    @Column({ default: "debugging" })
    @Field()
    _placeholder!: string;
}

export default Admin;
