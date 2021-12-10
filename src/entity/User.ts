import {
    Column,
    Entity,
    PrimaryGeneratedColumn,
    OneToOne,
    JoinColumn,
} from "typeorm";
import { Field, ObjectType, ID } from "type-graphql";
import { hash } from "argon2";
import { Client } from "./Client";
import { Instructor } from "./Instructor";
import Admin from "./Admin";

@ObjectType()
@Entity()
export class User {
    @Field(() => ID)
    @PrimaryGeneratedColumn()
    id!: number;

    @Field()
    @Column()
    firstName!: string;

    @Field()
    @Column()
    lastName!: string;

    @Field()
    @Column({ unique: true })
    email!: string;

    @Field()
    @Column()
    private password!: string;

    @Field(() => Client, { nullable: true })
    @OneToOne(() => Client, { eager: true })
    @JoinColumn()
    client!: Client;

    @Field(() => Instructor, { nullable: true })
    @OneToOne(() => Instructor, {
        eager: true,
    })
    @JoinColumn()
    instructor!: Instructor;

    @Field(() => Admin, { nullable: true })
    @OneToOne(() => Admin, {
        eager: true,
    })
    @JoinColumn()
    admin!: Admin;

    // Getters and setters

    /**Returns the user's hased password.*/
    getPassword() {
        return this.password;
    }

    async setPassword(plainPassword: string) {
        this.password = await hash(plainPassword);
    }

    // Constructor and factory
    private constructor(
        firstName: string,
        lastName: string,
        email: string,
        hashedPassword: string
    ) {
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.password = hashedPassword;
    }

    static async new(
        firstName: string,
        lastName: string,
        email: string,
        plainPassword: string
    ): Promise<User> {
        return new User(firstName, lastName, email, await hash(plainPassword));
    }
}
