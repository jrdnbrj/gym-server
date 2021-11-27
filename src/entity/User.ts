import { Entity, Column, PrimaryGeneratedColumn, BaseEntity } from "typeorm";
import { ObjectType, Field, registerEnumType } from "type-graphql";
import { hash } from "argon2";

// TODO: Use namespace merging to access UserRole as User.Role ?
export enum UserRole {
    Admin = "admin",
    Cashier = "cashier",
    Client = "client",
    Instructor = "instructor",
}

registerEnumType(UserRole, {
    name: "UserRole",
    description: "Role of the user.",
});

@ObjectType()
@Entity()
export class User extends BaseEntity {
    @Field()
    @PrimaryGeneratedColumn()
    id!: number;

    @Field(() => UserRole)
    @Column({
        type: "enum",
        enum: UserRole,
        default: UserRole.Client,
    })
    role!: UserRole;

    @Field()
    @Column()
    firstName!: string;

    @Field()
    @Column()
    lastName!: string;

    @Field()
    @Column()
    email!: string;

    @Field()
    @Column()
    private password!: string;

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
        role: UserRole
    ) {
        super();

        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.password = hashedPassword;
        this.role = role;
    }

    static async new(
        firsName: string,
        lastName: string,
        email: string,
        plainPassword: string,
        role: UserRole
    ): Promise<User> {
        return new User(
            firsName,
            lastName,
            email,
            await hash(plainPassword),
            role
        );
    }
}
