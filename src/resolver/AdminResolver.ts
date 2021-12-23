import {
    Resolver,
    Ctx,
    Query,
    Mutation,
    Arg,
    UseMiddleware,
} from "type-graphql";
import { RegularContext } from "../types/RegularContext";
import Admin from "../entity/Admin";
import { User } from "../entity/User";
import { ApolloError } from "apollo-server-core";
import { Client } from "../entity/Client";
import { Instructor } from "../entity/Instructor";
import { Not } from "typeorm";
import RequireAdmin from "../gql_middleware/RequireAdmin";

@Resolver()
export class AdminResolver {
    @Query(() => [User])
    async adminAll(@Ctx() { db }: RegularContext): Promise<User[]> {
        return await db.manager.find(User, { where: { admin: Not(null) } });
    }

    /**Adds given roles to a User. Must be logged as an admin user to use this mutation.*/
    @Mutation(() => User)
    @UseMiddleware(RequireAdmin)
    async adminUserRoles(
        @Arg("userID") userID: number,
        @Arg("isClient") isClient: boolean,
        @Arg("isInstructor") isInstructor: boolean,
        @Arg("isAdmin") isAdmin: boolean,
        @Ctx() { db }: RegularContext
    ): Promise<User> {
        // Change privileges
        let user = await db.manager.findOne(User, userID);
        if (!user) {
            throw new ApolloError("User does not exist.");
        }

        user.isClient = isClient;
        // if (!user.client) {
        //     const client = new Client();
        //     user.client = client;
        // }

        user.isInstructor = isInstructor;
        // if (!user.instructor) {
        //     const instructor = new Instructor();
        //     user.instructor = instructor;
        // }

        user.isAdmin = isAdmin;
        // if (!user.admin) {
        //     const admin = new Admin();
        //     user.admin = admin;
        // }

        // TODO: admin is null if assigning to user.
        // TODO: No assignment causes DEP0005: Buffer() is deprecated.
        await db.manager.save(user);

        return user;
    }
}
