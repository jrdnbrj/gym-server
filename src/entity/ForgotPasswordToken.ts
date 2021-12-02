import { Entity, Column, PrimaryColumn } from "typeorm";

@Entity()
export class ForgotPasswordToken {
    @PrimaryColumn()
    token!: string;

    @Column({ unique: true })
    userID!: number;
}
