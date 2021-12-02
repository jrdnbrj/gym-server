import { Resolver, Mutation, Query, Arg, Ctx } from "type-graphql";
import { ApolloError } from "apollo-server-core";
import { verify } from "argon2";
import { RegularContext } from "../types/RegularContext";
import { login } from "../util/login";
import { User } from "../entity/User";
import { Client } from "../entity/Client";
import { Instructor } from "../entity/Instructor";

@Resolver()
export class UserResolver {
    @Query(() => User, { nullable: true })
    async userMe(@Ctx() { req, db }: RegularContext): Promise<User | null> {
        const userId = req.session.userId;
        if (!userId) return null;

        const user = await db.manager.findOne(User, userId);

        if (!user) return null;
        return user;
    }

    @Mutation(() => User)
    async userLogin(
        @Arg("email") email: string,
        @Arg("password") plainPassword: string,
        @Ctx() { req, db }: RegularContext
    ): Promise<User> {
        const invalidEmailOrPasswordError = new ApolloError(
            "Email o contraseña inválida."
        );

        const user = await db.manager.findOne(User, { email });

        // user does not exist.
        if (!user) {
            throw invalidEmailOrPasswordError;
        }

        // Invalid password.
        const isPasswordValid = await verify(user.getPassword(), plainPassword);

        if (!isPasswordValid) {
            throw invalidEmailOrPasswordError;
        }

        // Login
        login(req, user);

        return user;
    }

    /**Always returns true. If there's an error, an ApolloError is thrown.*/
    @Mutation(() => Boolean)
    userLogout(@Ctx() { req }: RegularContext) {
        let error: string | null = null;

        req.session.destroy((err) => {
            error = err;
        });

        if (error) throw new ApolloError(error);
        return true;
    }

    /**Creates a new User with a User role.*/
    @Mutation(() => User)
    async userRegister(
        @Arg("firstName") firstName: string,
        @Arg("lastName") lastName: string,
        @Arg("email") email: string,
        @Arg("password") password: string,
        @Arg("isClient") isClient: boolean,
        @Arg("isInstructor") isInstructor: boolean,
        @Ctx()
        { db }: RegularContext
    ): Promise<User> {
        const existsUser = !!(await db.manager.findOne(User, { email }));

        if (existsUser) {
            throw new ApolloError("Email ya existe.");
        }

        let user = await User.new(firstName, lastName, email, password);
        user = await db.manager.save(user);

        let client: Client | undefined = undefined;
        let instructor: Instructor | undefined = undefined;

        if (isClient) {
            client = new Client();
            client.userID = user.id;
            await db.manager.save(client);
        }

        if (isInstructor) {
            instructor = new Instructor();
            instructor.userID = user.id;
            await db.manager.save(instructor);
        }

        if (client || instructor) {
            if (client) user.client = client;
            if (instructor) user.instructor = instructor;

            user = await db.manager.save(user);
        }

        // TODO: login automatically after successful register?
        return user;
    }

    @Query(() => [User])
    async userAll(@Ctx() { db }: RegularContext): Promise<User[]> {
        return await db.manager.find(User);
    }
}
