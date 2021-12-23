import { Resolver, Query, Arg, Mutation, ID, Ctx } from "type-graphql";
import { WeekSchedule } from "../entity/WeekSchedule";
import { Weekday } from "../enum/Weekday";
import { ApolloError } from "apollo-server-core";
import { RegularContext } from "../types/RegularContext";
import WorkoutType from "../enum/WorkoutType";
import { User } from "../entity/User";
import { DateTime } from "luxon";

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

    /**Creates a new WeekSchedule.
     *
     * `startDate` is a datetime string compliant with ISO-8601.
     */
    @Mutation(() => WeekSchedule)
    async weekScheduleCreate(
        @Arg("weekDays", () => [Weekday]) weekdays: Weekday[],
        @Arg("startDate", () => String) startDateString: string,
        @Arg("instructorID", () => ID) instructorID: number,
        @Arg("type", () => WorkoutType) workoutType: WorkoutType,
        @Ctx() { db }: RegularContext
    ): Promise<WeekSchedule> {
        const startDate = DateTime.fromISO(startDateString);
        if (!startDate.isValid) {
            throw new ApolloError(startDate.invalidExplanation!);
        }

        const instructorUser = await db.manager.findOne(User, instructorID, {
            relations: ["instructor.weekSchedules"],
        });
        if (!instructorUser) {
            throw new ApolloError("Instructor not found.");
        }

        if (!instructorUser.isInstructor) {
            throw new ApolloError(
                "Not enough privileges. instructorID's user is not an Instructor."
            );
        }

        let weekSchedule = new WeekSchedule();
        weekSchedule.instructor = instructorUser;
        weekSchedule.days = weekdays;
        weekSchedule.startDate = startDate.toJSDate();
        weekSchedule.workoutType = workoutType;

        weekSchedule = await db.manager.save(weekSchedule);

        // TODO: return updated instructor field.
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

        let clientUser = await db.manager.findOne(User, clientID);
        if (!clientUser) throw new ApolloError("Client not found.");
        if (!clientUser.isClient)
            throw new ApolloError(
                "Not enough privileges. clientID's user is not a Client."
            );

        weekSchedule.students.push(clientUser);
        weekSchedule.quotas -= 1;
        weekSchedule = await db.manager.save(weekSchedule);

        clientUser.client.weekScheduleIDs.push(weekSchedule.id);
        await db.manager.save(clientUser);

        return weekSchedule;
    }
}
