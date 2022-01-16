import {
    BaseEntity,
    Entity,
    ManyToMany,
    OneToOne,
    PrimaryGeneratedColumn,
} from "typeorm";
import { ObjectType, Field } from "type-graphql";
import { User } from "./User";
import { WeekSchedule } from "./WeekSchedule";

@Entity()
@ObjectType()
export class Client extends BaseEntity {
    @PrimaryGeneratedColumn()
    id!: number;

    @OneToOne(() => User, (user) => user.client, { onDelete: "CASCADE" })
    user!: Promise<User>;

    @ManyToMany(() => WeekSchedule, (ws) => ws.students, {
        onDelete: "RESTRICT",
    })
    weekSchedules!: Promise<WeekSchedule[]>;

    @Field(() => [WeekSchedule], { name: "weekSchedules" })
    _weekSchedulesField!: WeekSchedule[];
}
