import {
    Resolver,
    Query,
    Mutation,
    Arg,
    Ctx,
    UseMiddleware,
    ID,
    ResolverInterface,
    FieldResolver,
    Root,
} from "type-graphql";
import { Client } from "../entity/Client";
import { User } from "../entity/User";
import { ApolloError } from "apollo-server-core";
import { RegularContext } from "../types/RegularContext";
import { WeekSchedule } from "../entity/WeekSchedule";
import RequireClient from "../gql_middleware/RequireClient";

declare module "express-session" {
    interface SessionData {
        userId: string;
    }
}

@Resolver(() => Client)
export class ClientResolver implements ResolverInterface<Client> {
    @FieldResolver()
    async _weekSchedulesField(@Root() client: Client) {
        return await client.weekSchedules;
    }

    @Mutation(() => User)
    async clientRegister(
        @Arg("userID", () => ID) userID: string
    ): Promise<User> {
        const user = await User.findOne(userID);

        if (!user) {
            throw new ApolloError("User not found.");
        }

        if (await user.client)
            throw new ApolloError("Usuario ya es un cliente.");

        const client = new Client();

        user.client = Promise.resolve(client);
        await user.save();

        return user;
    }

    @Query(() => [User])
    async clientAll(): Promise<User[]> {
        return await User.find({ where: { isClient: true } });
    }

    /**Deletes a client's weekSchedule reservation.
     * Always returns true if no exception was thrown.
     */
    @Mutation(() => Boolean)
    @UseMiddleware(RequireClient)
    async clientRemoveReservation(
        @Arg("weekScheduleID", () => ID) weekScheduleID: string,
        @Ctx() { req }: RegularContext
    ): Promise<boolean> {
        const user = (await User.findOne(req.session.userId!))!;

        // Validate weekSchedule
        let weekSchedule = await WeekSchedule.findOne(weekScheduleID);

        if (!weekSchedule) {
            throw new ApolloError("WeekSchedule does not exist.");
        }

        // Delete
        const students = await weekSchedule.students;
        const studentsUserIDs = await Promise.all(
            students.map(async (s) => (await s.user).id)
        );
        const studentIndex = studentsUserIDs.indexOf(user.id);

        if (studentIndex >= 0) {
            weekSchedule.students = Promise.resolve(
                students.splice(studentIndex, 1)
            );

            weekSchedule.quotas += 1;
            await weekSchedule.save();
        }

        return true;
    }
}
