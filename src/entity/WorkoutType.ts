import { Field, ObjectType } from "type-graphql";
import { BaseEntity, Column, Entity, PrimaryColumn } from "typeorm";

@Entity()
@ObjectType()
export class WorkoutType extends BaseEntity {
    @PrimaryColumn()
    @Field()
    name!: string;

    @Column({ unique: true })
    @Field()
    emoji!: string;
}
