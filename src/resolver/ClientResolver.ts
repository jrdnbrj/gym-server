import {
    Resolver,
    Query,
    Mutation,
    Arg,
    Ctx,
    UseMiddleware,
    ID,
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

@Resolver()
export class ClientResolver {
    @Mutation(() => User)
    async clientRegister(
        @Arg("userID", () => ID) userID: string
    ): Promise<User> {
        const user = await User.findOne(userID);

        if (!user) {
            throw new ApolloError("User not found.");
        }

        const client = new Client();

        user.client = client;
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
        @Arg("weekScheduleID") weekScheduleID: number,
        @Ctx() { req }: RegularContext
    ): Promise<boolean> {
        const user = (await User.findOne(req.session.userId!))!;

        // Validate weekSchedule
        let weekSchedule = await WeekSchedule.findOne(
            { id: weekScheduleID },
            { relations: ["students"] }
        );

        if (!weekSchedule) {
            throw new ApolloError("WeekSchedule does not exist.");
        }

        // Delete
        let weekScheduleInClientIndex =
            user.client.weekScheduleIDs.indexOf(weekScheduleID);

        const studentIndex = weekSchedule.students
            .map((s) => s.id)
            .indexOf(user.id);

        if (studentIndex >= 0) {
            weekSchedule.students.splice(studentIndex, 1);
            weekSchedule.quotas += 1;
            await weekSchedule.save();
        }

        if (weekScheduleInClientIndex >= 0) {
            user.client.weekScheduleIDs.splice(weekScheduleInClientIndex, 1);
            await user.save();
        }

        return true;
    }
}
