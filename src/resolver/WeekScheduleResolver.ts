import {
    Resolver,
    Query,
    Arg,
    Mutation,
    ID,
    UseMiddleware,
    ResolverInterface,
    Root,
    FieldResolver,
} from "type-graphql";
import { WeekSchedule } from "../entity/WeekSchedule";
import { Weekday } from "../enum/Weekday";
import { ApolloError } from "apollo-server-core";
import { User } from "../entity/User";
import { DateTime } from "luxon";
import RequireAdmin from "../gql_middleware/RequireAdmin";
import { WorkoutType } from "../entity/WorkoutType";

@Resolver(() => WeekSchedule)
export class WeekScheduleResolver implements ResolverInterface<WeekSchedule> {
    @FieldResolver()
    async _workoutTypeField(@Root() ws: WeekSchedule) {
        return await ws.workoutType;
    }

    // TODO: get available WeekSchedules.

    @Query(() => [WeekSchedule])
    async weekScheduleAll(): Promise<WeekSchedule[]> {
        // TODO: Fix: relations [instructor] shouldn't be required with eager: true.
        return await WeekSchedule.find({
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
        @Arg("instructorID", () => ID) instructorID: string,
        @Arg("type", () => String) workoutType: string
    ): Promise<WeekSchedule> {
        const startDate = DateTime.fromISO(startDateString);
        if (!startDate.isValid) {
            throw new ApolloError(startDate.invalidExplanation!);
        }

        const instructorUser = await User.findOne(instructorID, {
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
        weekSchedule.workoutType = Promise.resolve(
            await WorkoutType.findOneOrFail(workoutType)
        );

        weekSchedule = await weekSchedule.save();

        // TODO: return updated instructor field.
        return weekSchedule;
    }

    @Mutation(() => WeekSchedule)
    async weekScheduleAddStudent(
        @Arg("weekScheduleID", () => ID) weekScheduleID: number,
        @Arg("clientID", () => ID) clientID: string
    ): Promise<WeekSchedule> {
        // TODO: don't allow same user to register twice.
        let weekSchedule = await WeekSchedule.findOne(weekScheduleID);
        if (!weekSchedule) throw new ApolloError("WeekSchedule not found.");
        if (weekSchedule.quotas == 0)
            throw new ApolloError("WeekSchedule already full.");

        let clientUser = await User.findOne(clientID);
        if (!clientUser) throw new ApolloError("Client not found.");
        if (!clientUser.isClient)
            throw new ApolloError(
                "Not enough privileges. clientID's user is not a Client."
            );

        weekSchedule.students.push(clientUser);
        weekSchedule.quotas -= 1;
        weekSchedule = await weekSchedule.save();

        clientUser.client.weekScheduleIDs.push(weekSchedule.id);
        await clientUser.save();

        return weekSchedule;
    }

    @Mutation(() => Boolean)
    @UseMiddleware(RequireAdmin)
    async weekScheduleRemove(
        @Arg("weekScheduleID") weekScheduleID: number
    ): Promise<boolean> {
        const weekSchedule = await WeekSchedule.findOne(weekScheduleID);

        if (!weekSchedule) {
            throw new ApolloError("WeekSchedule with given ID doesn't exist.");
        }

        await weekSchedule.remove();

        return true;
    }
}
