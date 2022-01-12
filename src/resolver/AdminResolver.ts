import {
    Resolver,
    Query,
    Mutation,
    Arg,
    UseMiddleware,
    ID,
} from "type-graphql";
import { User } from "../entity/User";
import { ApolloError } from "apollo-server-core";
import RequireAdmin from "../gql_middleware/RequireAdmin";
import Admin from "../entity/Admin";
import { Client } from "../entity/Client";
import { Instructor } from "../entity/Instructor";

@Resolver()
export class AdminResolver {
    @Query(() => [User])
    async adminAll(): Promise<User[]> {
        const allAdmins = await Admin.find({});
        return await Promise.all(allAdmins.map(async (a) => await a.user));
    }

    /**Adds given roles to a User. Must be logged as an admin user to use this mutation.*/
    @Mutation(() => User)
    @UseMiddleware(RequireAdmin)
    async adminUserRoles(
        @Arg("userID", () => ID) userID: string,
        @Arg("isClient") isClient: boolean,
        @Arg("isInstructor") isInstructor: boolean,
        @Arg("isAdmin", { nullable: true }) isAdmin?: boolean
    ): Promise<User> {
        // Change privileges
        let user = await User.findOne(userID);
        if (!user) {
            throw new ApolloError("User does not exist.");
        }

        if (isClient !== undefined && isClient !== null) {
            const currentClient = await user.client;

            if (isClient && !currentClient) {
                user.client = Promise.resolve(new Client());
            }

            if (!isClient) {
                if (currentClient) await currentClient.remove();

                user.client = Promise.resolve(null);
            }
        }

        if (isInstructor !== undefined && isInstructor !== null) {
            const currentInst = await user.instructor;

            if (isInstructor && !currentInst) {
                user.instructor = Promise.resolve(new Instructor());
            }

            if (!isInstructor) {
                if (currentInst) await currentInst.remove();

                user.instructor = Promise.resolve(null);
            }
        }

        if (isAdmin !== undefined && isAdmin !== null) {
            const currentAdmin = await user.admin;

            if (isAdmin && !currentAdmin) {
                user.admin = Promise.resolve(new Admin());
            }

            if (!isAdmin) {
                if (currentAdmin) await currentAdmin.remove();

                user.admin = Promise.resolve(null);
            }
        }

        // TODO: admin is null if assigning to user.
        // TODO: No assignment causes DEP0005: Buffer() is deprecated.
        await user.save();

        return user;
    }
}
