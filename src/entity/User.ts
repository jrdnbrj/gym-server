import {
    BaseEntity,
    Column,
    Entity,
    JoinColumn,
    OneToOne,
    PrimaryGeneratedColumn,
} from "typeorm";
import { Field, ObjectType, ID } from "type-graphql";
import { hash } from "argon2";
import { Client } from "./Client";
import { Instructor } from "./Instructor";
import Admin from "./Admin";
import { WeekSchedule } from "./WeekSchedule";
import { ApolloError } from "apollo-server-core";

export const instructorReferencedError = new ApolloError(
    "Instructor tiene clases asignadas. Elimine estas clases primero."
);

export const userNotInstructorError = new ApolloError(
    "Usuario no es un instructor."
);

interface IsRoleInterface {
    isClient?: boolean;
    isInstructor?: boolean;
    isAdmin?: boolean;
}

@ObjectType()
@Entity()
export class User extends BaseEntity {
    @Field(() => ID)
    @PrimaryGeneratedColumn("uuid")
    id!: string;

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

    @Field(() => Boolean, { name: "isClient" })
    _isClientField!: boolean;

    @OneToOne(() => Client, (client) => client.user, {
        nullable: true,
        cascade: true,
        onDelete: "SET NULL",
    })
    @JoinColumn()
    client!: Promise<Client | null>;

    @Field(() => Client, { name: "client", nullable: true })
    _clientField!: Client | null;

    @Field(() => Boolean, { name: "isInstructor" })
    _isInstructorField!: boolean;

    @OneToOne(() => Instructor, (instructor) => instructor.user, {
        nullable: true,
        cascade: true,
        onDelete: "SET NULL",
    })
    @JoinColumn()
    instructor!: Promise<Instructor | null>;

    @Field(() => Instructor, { name: "instructor", nullable: true })
    _instructorField!: Instructor | null;

    @Field(() => Boolean, { name: "isAdmin" })
    _isAdminField!: boolean;

    @Field(() => Admin, { nullable: true })
    @OneToOne(() => Admin, (admin) => admin.user, {
        nullable: true,
        cascade: true,
        onDelete: "SET NULL",
    })
    @JoinColumn()
    admin!: Promise<Admin | null>;

    @Field(() => Admin, { name: "admin", nullable: true })
    _adminField!: Admin | null;

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
        hashedPassword: string,
        roles?: IsRoleInterface
    ) {
        super();

        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.password = hashedPassword;

        if (roles) {
            const { isClient, isInstructor, isAdmin } = roles;

            if (isClient) this.client = Promise.resolve(new Client());
            else this.client = Promise.resolve(null);

            if (isInstructor)
                this.instructor = Promise.resolve(new Instructor());
            else this.instructor = Promise.resolve(null);

            if (isAdmin) this.admin = Promise.resolve(new Admin());
            else this.admin = Promise.resolve(null);
        }
    }

    static async new(
        firstName: string,
        lastName: string,
        email: string,
        plainPassword: string,
        roles?: IsRoleInterface
    ): Promise<User> {
        const user = new User(
            firstName,
            lastName,
            email,
            await hash(plainPassword),
            roles
        );
        return user;
    }

    async deleteInstructorRole() {
        const instructor = await this.instructor;
        if (!instructor) throw userNotInstructorError;

        const refWs = await WeekSchedule.find({
            where: { instructor },
        });

        if (refWs.length > 0) throw instructorReferencedError;

        await instructor.remove();
        await this.reload();
    }
}
