import { Resolver, Ctx, Query, Mutation, Arg } from "type-graphql";
import { RegularContext } from "../types/RegularContext";
import Admin from "../entity/Admin";
import { User } from "../entity/User";
import { ApolloError } from "apollo-server-core";
import { Client } from "../entity/Client";
import { Instructor } from "../entity/Instructor";

declare module "express-session" {
    interface SessionData {
        userId: number;
    }
}

@Resolver()
export class AdminResolver {
    @Query(() => [Admin])
    async adminAll(@Ctx() { db }: RegularContext): Promise<Admin[]> {
        return await db.manager.find(Admin, {});
    }

    /**Adds given roles to a User. Must be logged as an admin user to use this mutation.*/
    @Mutation(() => User)
    async adminAddUserRoles(
        @Arg("userID") userID: number,
        @Arg("toClient") toClient: boolean,
        @Arg("toInstructor") toInstructor: boolean,
        @Arg("toAdmin") toAdmin: boolean,
        @Ctx() { db, req }: RegularContext
    ): Promise<User> {
        const loggedUserID = req.session.userId;
        if (loggedUserID === undefined) {
            throw new ApolloError("Not logged in.");
        }

        const loggedUser = await db.manager.findOne(User, loggedUserID);
        if (!loggedUser) {
            throw new ApolloError(
                "Logged in user does not exist. Please, login again."
            );
        }

        if (!loggedUser.admin) {
            throw new ApolloError("Not enough privileges.");
        }

        // Change privileges
        let user = await db.manager.findOne(User, userID);
        if (!user) {
            throw new ApolloError("User does not exist.");
        }

        let wasUpdated = false;

        if (toClient && !user.client) {
            const client = new Client();
            client.userID = user.id;

            await db.manager.save(client);

            user.client = client;
            wasUpdated = true;
        }

        if (toInstructor && !user.instructor) {
            const instructor = new Instructor();
            instructor.userID = user.id;

            await db.manager.save(instructor);

            user.instructor = instructor;
            wasUpdated = true;
        }

        if (toAdmin && !user.admin) {
            const admin = new Admin();
            admin.userID = user.id;

            await db.manager.save(admin);

            user.admin = admin;
            wasUpdated = true;
        }

        if (wasUpdated) {
            user = await db.manager.save(user);
        }

        return user;
    }
}
