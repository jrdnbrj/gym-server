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
import { Not } from "typeorm";
import RequireAdmin from "../gql_middleware/RequireAdmin";

@Resolver()
export class AdminResolver {
    @Query(() => [User])
    async adminAll(): Promise<User[]> {
        // FIXME: might not work.
        return await User.find({ where: { admin: Not(null) } });
    }

    /**Adds given roles to a User. Must be logged as an admin user to use this mutation.*/
    @Mutation(() => User)
    @UseMiddleware(RequireAdmin)
    async adminUserRoles(
        @Arg("userID", () => ID) userID: string,
        @Arg("isClient") isClient: boolean,
        @Arg("isInstructor") isInstructor: boolean,
        @Arg("isAdmin") isAdmin: boolean
    ): Promise<User> {
        // Change privileges
        let user = await User.findOne(userID);
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
        await user.save();

        return user;
    }
}
