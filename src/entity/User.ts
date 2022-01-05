import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { Field, ObjectType, ID } from "type-graphql";
import { hash } from "argon2";
import { Client } from "./Client";
import { Instructor } from "./Instructor";
import Admin from "./Admin";

@ObjectType()
@Entity()
export class User extends BaseEntity {
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

    @Field(() => Boolean)
    @Column({ default: false })
    isClient!: boolean;

    @Column(() => Client)
    client!: Client;

    @Field(() => Client, { name: "client", nullable: true })
    clientField!: Client | null;

    @Field(() => Boolean)
    @Column({ default: false })
    isInstructor!: boolean;

    @Field(() => Instructor, { nullable: true })
    @Column(() => Instructor)
    instructor!: Instructor;

    @Field(() => Instructor, { name: "instructor", nullable: true })
    instructorField!: Instructor | null;

    @Field(() => Boolean)
    @Column({ default: false })
    isAdmin!: boolean;

    @Field(() => Admin, { nullable: true })
    @Column(() => Admin)
    admin!: Admin;

    @Field(() => Admin, { name: "admin", nullable: true })
    adminField!: Admin | null;

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
        super();

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
        const user = new User(
            firstName,
            lastName,
            email,
            await hash(plainPassword)
        );
        return user;
    }
}
