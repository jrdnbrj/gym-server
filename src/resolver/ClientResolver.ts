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
    Args,
} from "type-graphql";
import { Client } from "../entity/Client";
import { User } from "../entity/User";
import { ApolloError } from "apollo-server-core";
import { RegularContext } from "../types/RegularContext";
import { WeekSchedule } from "../entity/WeekSchedule";
import RequireClient from "../gql_middleware/RequireClient";
import { ClientHasPaidForWeekScheduleArgs } from "./args_type/ClientResolver.args";
import { userDoesNotExistError } from "../error/userDoesNotExistError";
import { DateTime } from "luxon";
import { userIsNotClientError } from "../error/userIsNotRole";

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
     *
     * Returns true if reservation was removed. Otherwise, it returns false. It may be the case that it returns false because the client wasn't a student of the given weekSchedule.
     */
    @Mutation(() => Boolean)
    @UseMiddleware(RequireClient)
    async clientRemoveReservation(
        @Arg("weekScheduleID", () => ID) weekScheduleID: string,
        @Ctx() { req }: RegularContext
    ): Promise<boolean> {
        // TODO: restrict mutation if class has already been paid for.
        const user = (await User.findOne(req.session.userId!))!;
        const client = (await user.client)!;

        // Validate weekSchedule
        let weekSchedule = await WeekSchedule.findOne(weekScheduleID);

        if (!weekSchedule) {
            throw new ApolloError("WeekSchedule does not exist.");
        }

        // Check if it hasn't been paid for.

        // Delete
        const students = await weekSchedule.students;
        const studentsUserIDs = students.map((s) => s.id);
        const studentIndex = studentsUserIDs.indexOf((await user.client)!.id);

        if (studentIndex >= 0) {
            weekSchedule.students = Promise.resolve(
                students.filter((s) => s.id != client.id)
            );

            weekSchedule.quotas += 1;
            await weekSchedule.save();

            return true;
        }

        return false;
    }

    @Query(() => Boolean)
    async clientHasPaidForWeekSchedule(
        @Args()
        {
            weekScheduleID,
            clientID,
            monthDate,
        }: ClientHasPaidForWeekScheduleArgs
    ): Promise<boolean> {
        const clientUser = await User.findOne(clientID);
        if (!clientUser) throw userDoesNotExistError;

        const client = await clientUser.client;
        if (!client) throw userIsNotClientError;

        const datetime = monthDate ? DateTime.fromJSDate(monthDate) : undefined;

        return await client.hasPaidFor(weekScheduleID, datetime);
    }
}
