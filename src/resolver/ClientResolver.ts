import { Resolver, Query, Mutation, Arg, Ctx, ID } from "type-graphql";
import { Client } from "../entity/Client";
import { User } from "../entity/User";
import { ApolloError } from "apollo-server-core";
import { RegularContext } from "../types/RegularContext";
import { WeekSchedule } from "../entity/WeekSchedule";

@Resolver()
export class ClientResolver {
    @Mutation(() => User)
    async clientRegister(
        @Arg("userID") userID: number,
        @Ctx() { db }: RegularContext
    ): Promise<User> {
        const user = await db.manager.findOne(User, userID);

        if (!user) {
            throw new ApolloError("User not found.");
        }

        const client = new Client();
        client.userID = user.id;
        await db.manager.save(client);

        user.client = client;
        await db.manager.save(user);

        return user;
    }

    @Query(() => [Client])
    async clientAll(@Ctx() { db }: RegularContext): Promise<Client[]> {
        return await db.manager.find(Client);
    }

    /**Deletes a client's weekSchedule reservation.
     * Always returns true if no exception was thrown.
     */
    @Mutation(() => Boolean)
    async clientRemoveReservation(
        @Arg("clientID") clientID: number,
        @Arg("weekScheduleID") weekScheduleID: number,
        @Ctx() { db }: RegularContext
    ): Promise<boolean> {
        // TODO: require login instead of clientID.
        // Search client
        let client = await db.manager.findOne(Client, clientID);
        if (!client) {
            throw new ApolloError("Client not found.");
        }

        let weekSchedule = await db.manager.findOne(
            WeekSchedule,
            { id: weekScheduleID },
            { relations: ["students"] }
        );

        if (!weekSchedule) {
            throw new ApolloError("WeekSchedule does not exist.");
        }

        // Delete
        let weekScheduleInClientIndex =
            client.weekScheduleIDs.indexOf(weekScheduleID);

        const studentIndex = weekSchedule.students
            .map((s) => s.id)
            .indexOf(clientID);

        if (studentIndex >= 0) {
            weekSchedule.students.splice(studentIndex, 1);
            weekSchedule.quotas += 1;
            await db.manager.save(weekSchedule);
        }

        if (weekScheduleInClientIndex >= 0) {
            client.weekScheduleIDs.splice(weekScheduleInClientIndex, 1);
            await db.manager.save(client);
        }

        return true;
    }
}
