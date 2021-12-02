import { Resolver, Query, Arg, Mutation, ID, Ctx } from "type-graphql";
import { WeekSchedule } from "../entity/WeekSchedule";
import { DateInput } from "../input/GQLDate";
import { Weekday } from "../enum/Weekday";
import { Instructor } from "../entity/Instructor";
import { ApolloError } from "apollo-server-core";
import { RegularContext } from "../types/RegularContext";
import { Client } from "../entity/Client";

@Resolver()
export class WeekScheduleResolver {
    // TODO: get available WeekSchedules.

    @Query(() => [WeekSchedule])
    async weekScheduleAll(
        @Ctx() { db }: RegularContext
    ): Promise<WeekSchedule[]> {
        // TODO: Fix: relations [instructor] shouldn't be required with eager: true.
        return await db.manager.find(WeekSchedule, {
            relations: ["instructor"],
        });
    }

    @Mutation(() => WeekSchedule)
    async weekScheduleCreate(
        @Arg("weekDays", () => [Weekday]) weekdays: Weekday[],
        @Arg("startDate", () => DateInput) startDateGQL: DateInput,
        @Arg("instructorID", () => ID) instructorID: number,
        @Ctx() { db }: RegularContext
    ): Promise<WeekSchedule> {
        const { year, month, day, hours, minutes } = startDateGQL;
        const startDate = new Date(year, month, day, hours, minutes);

        const instructor = await db.manager.findOne(Instructor, instructorID);
        if (!instructor) {
            throw new ApolloError("Instructor not found.");
        }

        const weekSchedule = new WeekSchedule(instructor, weekdays, startDate);
        await db.manager.save(weekSchedule);

        instructor.weekScheduleIDs.push(weekSchedule.id);
        await db.manager.save(instructor);

        return weekSchedule;
    }

    @Mutation(() => WeekSchedule)
    async weekScheduleAddStudent(
        @Arg("weekScheduleID", () => ID) weekScheduleID: number,
        @Arg("clientID", () => ID) clientID: number,
        @Ctx() { db }: RegularContext
    ): Promise<WeekSchedule> {
        // TODO: don't allow same user to register twice.
        let weekSchedule = await db.manager.findOne(
            WeekSchedule,
            weekScheduleID
        );
        if (!weekSchedule) throw new ApolloError("WeekSchedule not found.");
        if (weekSchedule.quotas == 0)
            throw new ApolloError("WeekSchedule already full.");

        let client = await db.manager.findOne(Client, clientID);
        if (!client) throw new ApolloError("Client not found.");

        weekSchedule.students.push(client);
        weekSchedule.quotas -= 1;
        weekSchedule = await db.manager.save(weekSchedule);

        client.weekScheduleIDs.push(weekSchedule.id);
        await db.manager.save(client);

        return weekSchedule;
    }
}
