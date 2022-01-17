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
    Args,
} from "type-graphql";
import { WeekSchedule } from "../entity/WeekSchedule";
import { Weekday } from "../enum/Weekday";
import { ApolloError } from "apollo-server-core";
import { User } from "../entity/User";
import { DateTime } from "luxon";
import RequireAdmin from "../gql_middleware/RequireAdmin";
import { WorkoutType } from "../entity/WorkoutType";
import { dateWithoutTimezone } from "../util/dateWithoutTimezone";
import { userDoesNotExistError } from "../error/userDoesNotExistError";
import { userIsNotInstructorError } from "../error/userIsNotRole";
import { WeekScheduleChangeInstructorArgs } from "./args_type/WeekScheduleResolver.args";

export const weekScheduleHasStudentsError = new ApolloError(
    "Clase tiene estudiantes asignados."
);

export const weekScheduleNotFoundError = new ApolloError(
    "Clase no encontrada."
);

@Resolver(() => WeekSchedule)
export class WeekScheduleResolver implements ResolverInterface<WeekSchedule> {
    @FieldResolver()
    async _instructorField(@Root() ws: WeekSchedule) {
        return await (
            await ws.instructor
        ).user;
    }

    @FieldResolver()
    async _workoutTypeField(@Root() ws: WeekSchedule) {
        return await ws.workoutType;
    }

    @FieldResolver()
    async _studentsField(@Root() ws: WeekSchedule) {
        const students = await ws.students;

        return await Promise.all(students.map(async (s) => s.user));
    }

    // TODO: get available WeekSchedules.

    @Query(() => [WeekSchedule])
    async weekScheduleAll(): Promise<WeekSchedule[]> {
        return await WeekSchedule.find({});
    }

    /**Creates a new WeekSchedule.
     *
     * `startDate` is a datetime string compliant with ISO-8601.
     */
    @Mutation(() => WeekSchedule)
    async weekScheduleCreate(
        @Arg("weekDays", () => [Weekday]) weekdays: Weekday[],
        @Arg("price") price: number,
        @Arg("startDate", () => String) startDateString: string,
        @Arg("instructorID", () => ID) instructorID: string,
        @Arg("type", () => String) workoutType: string
    ): Promise<WeekSchedule> {
        const startDate = DateTime.fromISO(startDateString);
        if (!startDate.isValid) {
            throw new ApolloError(startDate.invalidExplanation!);
        }

        const instructorUser = await User.findOne(instructorID);
        if (!instructorUser) {
            throw new ApolloError("Instructor not found.");
        }

        if (!(await instructorUser.instructor)) {
            throw new ApolloError(
                "Not enough privileges. instructorID's user is not an Instructor."
            );
        }

        let weekSchedule = new WeekSchedule(price);
        weekSchedule.instructor = Promise.resolve(
            (await instructorUser.instructor)!
        );
        weekSchedule.days = weekdays;
        weekSchedule.startDate = dateWithoutTimezone(startDate.toJSDate());
        weekSchedule.workoutType = Promise.resolve(
            await WorkoutType.findOneOrFail({ name: workoutType })
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
        if (!(await clientUser.client))
            throw new ApolloError(
                "Not enough privileges. clientID's user is not a Client."
            );

        const students = await weekSchedule.students;
        students.push((await clientUser.client)!);

        weekSchedule.students = Promise.resolve(students);
        weekSchedule.quotas -= 1;
        weekSchedule = await weekSchedule.save();

        return weekSchedule;
    }

    @Mutation(() => Boolean)
    @UseMiddleware(RequireAdmin)
    async weekScheduleRemove(
        @Arg("weekScheduleID", () => ID) weekScheduleIDStr: string
    ): Promise<boolean> {
        const weekScheduleID = Number.parseInt(weekScheduleIDStr);

        const weekSchedule = await WeekSchedule.findOne(weekScheduleID);

        if (!weekSchedule) {
            throw weekScheduleNotFoundError;
        }

        if ((await weekSchedule.students).length > 0)
            throw weekScheduleHasStudentsError;

        await weekSchedule.remove();

        return true;
    }

    @Mutation(() => WeekSchedule)
    @UseMiddleware(RequireAdmin)
    async weekScheduleChangeInstructor(
        @Args()
        { weekScheduleID, instructorID }: WeekScheduleChangeInstructorArgs
    ) {
        // Find WS.
        const ws = await WeekSchedule.findOne(weekScheduleID);
        if (!ws) throw weekScheduleNotFoundError;

        // Find instructor.
        const user = await User.findOne(instructorID);
        if (!user) throw userDoesNotExistError;

        const instructor = await user.instructor;
        if (!instructor) throw userIsNotInstructorError;

        // Change instructor.
        ws.instructor = Promise.resolve(instructor);
        return ws.save();
    }
}
