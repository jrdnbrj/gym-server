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
    async adminAddUserRoles(
        @Arg("userID") userID: number,
        @Arg("toClient", { defaultValue: false }) toClient: boolean,
        @Arg("toInstructor", { defaultValue: false })
        toInstructor: boolean,
        @Arg("toAdmin", { defaultValue: false }) toAdmin: boolean,
        @Ctx() { db }: RegularContext
    ): Promise<User> {
        // Change privileges
        let user = await db.manager.findOne(User, userID);
        if (!user) {
            throw new ApolloError("User does not exist.");
        }

        let wasUpdated = false;

        if (toClient && !user.isClient) {
            user.isClient = true;
            const client = new Client();

            user.client = client;
            wasUpdated = true;
        }

        if (toInstructor && !user.isInstructor) {
            user.isInstructor = true;
            const instructor = new Instructor();

            user.instructor = instructor;
            wasUpdated = true;
        }

        if (toAdmin && !user.isAdmin) {
            user.isAdmin = true;
            const admin = new Admin();

            user.admin = admin;
            wasUpdated = true;
        }

        if (wasUpdated) {
            // TODO: admin is null if assigning to user.
            // TODO: No assignment causes DEP0005: Buffer() is deprecated.
            await db.manager.save(user);
        }

        return user;
    }
}
