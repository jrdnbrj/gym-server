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
    Args,
} from "type-graphql";
import { ApolloError } from "apollo-server-core";
import { verify } from "argon2";
import { RegularContext } from "../types/RegularContext";
import { login } from "../util/login";
import { User } from "../entity/User";
import { randomBytes } from "crypto";
import { ForgotPasswordToken } from "../entity/ForgotPasswordToken";
import sendEmail from "../util/sendEmail";
import { UserInfoInput } from "../input/UserInfoInput";
import { getLoggedInUser } from "../util/getLoggedInUser";
import { emailTakenError } from "../error/emailTakenError";

declare module "express-session" {
    interface SessionData {
        userId: string;
    }
}

@Resolver(() => User)
export class UserResolver implements ResolverInterface<User> {
    @FieldResolver()
    async _isClientField(@Root() user: User) {
        return !!(await user.client);
    }

    @FieldResolver()
    async _clientField(@Root() user: User) {
        return await user.client;
    }

    @FieldResolver()
    async _isInstructorField(@Root() user: User) {
        return !!(await user.instructor);
    }

    @FieldResolver()
    async _instructorField(@Root() user: User) {
        return await user.instructor;
    }

    @FieldResolver()
    async _isAdminField(@Root() user: User) {
        return !!(await user.admin);
    }

    @FieldResolver()
    async _adminField(@Root() user: User) {
        return await user.admin;
    }

    @Query(() => User, { nullable: true })
    async userByID(
        @Arg("userID", () => ID) userID: string
    ): Promise<User | null> {
        const user = await User.findOne(userID);

        if (!user) return null;
        return user;
    }

    @Query(() => User, { nullable: true })
    async userMe(@Ctx() { req }: RegularContext): Promise<User | null> {
        const userId = req.session.userId;
        if (!userId) return null;

        const user = await User.findOne(userId);

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

    /**Always returns true if successful. If there's an error, an ApolloError is thrown.*/
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
        @Arg("isAdmin") isAdmin: boolean
    ): Promise<User> {
        const existsUser = !!(await User.findOne({ email }));

        if (existsUser) {
            throw new ApolloError("Email ya existe.");
        }

        let user = await User.new(firstName, lastName, email, password, {
            isAdmin,
            isClient,
            isInstructor,
        });

        user = await user.save();

        // TODO: login automatically after successful register?
        return user;
    }

    /**Returns a token for changing a user's password with userChangePassword.*/
    // TODO: needs testing
    @Mutation(() => String)
    async userForgotPassword(
        @Arg("userEmail", () => String) userEmail: string,
        @Ctx() { transporter }: RegularContext
    ): Promise<string> {
        const user = await User.findOne({ email: userEmail });
        if (!user) {
            throw new ApolloError("User not found.");
        }

        // If token already exists, then it is deleted and another one is generated.
        if (
            !!(await ForgotPasswordToken.findOne({
                userID: user.id,
            }))
        ) {
            await ForgotPasswordToken.delete({ userID: user.id });
        }

        const tokenString = randomBytes(32).toString("hex");

        let token = new ForgotPasswordToken();
        token.token = tokenString;
        token.userID = user.id;

        token = await token.save();

        const url = `http://localhost:3000/password/${token.token}`;

        console.log("URL:", url);

        // Send email
        await sendEmail(transporter, {
            to: `"${user.firstName} ${user.lastName}"  <${user.email}>`,
            subject: "Cambia tu contraseña de RADIKAL GYM",
            html: `<p>¡Hola! Solicitaste un cambio de contraseña. Utiliza el siguiente enlace para reestablecerla: </p> <br /> <a href="${url}">Cambiar Contraseña</a>`,
        });

        return token.token;
    }

    /**Changes a user's password using the token returned by userForgotPassword.*/
    @Mutation(() => Boolean)
    async userChangePassword(
        @Arg("token") tokenString: string,
        @Arg("newPassword") plainPassword: string
    ): Promise<boolean> {
        const token = await ForgotPasswordToken.findOne(tokenString);
        // TODO: Invalidate all user's sessions on changePassword.

        if (!token) throw new ApolloError("Token doesn't exist.");

        // Change password.
        const user = await User.findOne(token.userID);
        if (!user) throw new ApolloError("User does not exist.");

        await user.setPassword(plainPassword);
        await user.save();

        await ForgotPasswordToken.delete({ token: tokenString });

        return true;
    }

    @Query(() => [User])
    async userAll(): Promise<User[]> {
        return await User.find({});
    }

    @Mutation(() => User)
    async userEditInfo(
        @Args() { firstName, lastName, email }: UserInfoInput,
        @Ctx() { req }: RegularContext
    ): Promise<User> {
        const user = await getLoggedInUser(req);

        if (firstName) user.firstName = firstName;

        if (lastName) user.lastName = lastName;

        if (email) {
            if (await User.findOne({ email })) throw emailTakenError;
            user.email = email;
        }

        return user.save();
    }
}
