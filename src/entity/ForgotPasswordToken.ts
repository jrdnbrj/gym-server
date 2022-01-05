import { Entity, Column, PrimaryColumn, BaseEntity } from "typeorm";

@Entity()
export class ForgotPasswordToken extends BaseEntity {
    @PrimaryColumn()
    token!: string;

    @Column({ unique: true })
    userID!: number;
}
