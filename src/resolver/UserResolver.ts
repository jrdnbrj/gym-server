import {
    Resolver,
    Mutation,
    Query,
    Arg,
    Ctx,
    ID,
    FieldResolver,
    Root,
    ResolverInterface,
} from "type-graphql";
import { ApolloError } from "apollo-server-core";
import { verify } from "argon2";
import { RegularContext } from "../types/RegularContext";
import { login } from "../util/login";
import { User } from "../entity/User";
import { randomBytes } from "crypto";
import { ForgotPasswordToken } from "../entity/ForgotPasswordToken";
import sendEmail from "../util/sendEmail";
import { Client } from "../entity/Client";
import { Instructor } from "../entity/Instructor";
import Admin from "../entity/Admin";

declare module "express-session" {
    interface SessionData {
        userId: number;
    }
}

@Resolver(() => User)
export class UserResolver implements ResolverInterface<User> {
    @FieldResolver()
    clientField(@Root() user: User) {
        if (!user.isClient) return null;
        return user.client;
    }

    @FieldResolver()
    instructorField(@Root() user: User) {
        if (!user.isInstructor) return null;
        return user.instructor;
    }

    @FieldResolver()
    adminField(@Root() user: User) {
        if (!user.isAdmin) return null;
        return user.admin;
    }

    @Query(() => User, { nullable: true })
    async userByID(
        @Arg("userID", () => ID) userID: number,
        @Ctx() { db }: RegularContext
    ): Promise<User | null> {
        const user = await db.manager.findOne(User, userID);

        if (!user) return null;
        return user;
    }

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

    // TODO: always returns true?
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

    // TODO: require admin permissons.
    /**Creates a new User with a User role.*/
    @Mutation(() => User)
    async userRegister(
        @Arg("firstName") firstName: string,
        @Arg("lastName") lastName: string,
        @Arg("email") email: string,
        @Arg("password") password: string,
        @Arg("isClient") isClient: boolean,
        @Arg("isInstructor") isInstructor: boolean,
        @Arg("isAdmin") isAdmin: boolean,
        @Ctx()
        { db }: RegularContext
    ): Promise<User> {
        const existsUser = !!(await db.manager.findOne(User, { email }));

        if (existsUser) {
            throw new ApolloError("Email ya existe.");
        }

        let user = await User.new(firstName, lastName, email, password);

        if (isClient) {
            user.isClient = true;
            user.client = new Client();
        }

        if (isInstructor) {
            user.isInstructor = true;
            user.instructor = new Instructor();
        }

        if (isAdmin) {
            user.isAdmin = true;
            user.admin = new Admin();
        }

        user = await db.manager.save(user);

        // TODO: login automatically after successful register?
        return user;
    }

    /**Returns a token for changing a user's password with userChangePassword.*/
    @Mutation(() => String)
    async userForgotPassword(
        @Arg("userEmail", () => String) userEmail: string,
        @Ctx() { db }: RegularContext
    ): Promise<string> {
        const user = await db.manager.findOne(User, { email: userEmail });
        if (!user) {
            throw new ApolloError("User not found.");
        }

        // If token already exists, then it is deleted and another one is generated.
        if (
            !!(await db.manager.findOne(ForgotPasswordToken, {
                userID: user.id,
            }))
        ) {
            await db.manager.delete(ForgotPasswordToken, { userID: user.id });
        }

        const tokenString = randomBytes(32).toString("hex");

        let token = new ForgotPasswordToken();
        token.token = tokenString;
        token.userID = user.id;

        token = await db.manager.save(token);

        const url = `http://localhost:3000/password/${token.token}`;
        
        console.log("URL:", url);

        // Send email
        await sendEmail(
            `"${user.firstName} ${user.lastName}"  <${user.email}>`,
            "Cambia tu contraseña de RADIKAL GYM",
            `<p>¡Hola! Solicitaste un cambio de contraseña. Utiliza el siguiente enlace para reestablecerla: </p> <br /> <a href="${url}">Cambiar Contraseña</a>`
        );

        return token.token;
    }

    /**Changes a user's password using the token returned by userForgotPassword.*/
    @Mutation(() => Boolean)
    async userChangePassword(
        @Arg("token") tokenString: string,
        @Arg("newPassword") plainPassword: string,
        @Ctx() { db }: RegularContext
    ): Promise<boolean> {
        const token = await db.manager.findOne(
            ForgotPasswordToken,
            tokenString
        );
        // TODO: Invalidate all user's sessions on changePassword.

        if (!token) throw new ApolloError("Token doesn't exist.");

        // Change password.
        const user = await db.manager.findOne(User, token.userID);
        if (!user) throw new ApolloError("User does not exist.");

        user.setPassword(plainPassword);
        await db.manager.save(user);

        db.manager.delete(ForgotPasswordToken, { token: tokenString });

        return true;
    }

    @Query(() => [User])
    async userAll(@Ctx() { db }: RegularContext): Promise<User[]> {
        return await db.manager.find(User, {
            relations: ["instructor.weekSchedules"],
        });
    }
}
