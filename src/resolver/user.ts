import { Resolver, Mutation, Query, Arg, Ctx } from "type-graphql";
import { User, UserRole } from "../entity/User";
import { ApolloError } from "apollo-server-core";
import { verify } from "argon2";
import { RegularContext } from "../types/RegularContext";
import login from "../util/login";

// TODO: Move type declaration to another file.
declare module "express-session" {
    interface SessionData {
        userId: number;
    }
}

@Resolver()
export class UserResolver {
    @Query(() => User, { nullable: true })
    async userMe(@Ctx() { req }: RegularContext): Promise<User | null> {
        const userId = req.session.userId;
        if (!userId) return null;

        const user = await User.findOne(req.session.userId);

        if (!user) return null;
        return user;
    }

    @Mutation(() => User)
    async userLogin(
        @Arg("email") email: string,
        @Arg("password") plainPassword: string,
        @Ctx() { req }: RegularContext
    ): Promise<User> {
        const invalidEmailOrPasswordError = new ApolloError(
            "Email o contraseña inválida."
        );

        const user = await User.findOne({ email });

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

    /**Creates a new User with a Client role.*/
    @Mutation(() => User)
    async userRegister(
        @Arg("firstName") firstName: string,
        @Arg("lastName") lastName: string,
        @Arg("email") email: string,
        @Arg("password") password: string
    ): Promise<User> {
        const existsUser = !!(await User.findOne({ email }));

        if (existsUser) {
            throw new ApolloError("Email ya existe.");
        }

        const user = await User.new(
            firstName,
            lastName,
            email,
            password,
            UserRole.Client
        );
        await user.save();

        // TODO: login automatically after successful register?
        return user;
    }

    @Query(() => [User])
    async userAll(): Promise<User[]> {
        return await User.find();
    }
}
