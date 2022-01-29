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
import { userDoesNotExistError } from "../error/userDoesNotExistError";
import { userIsNotInstructorError } from "../error/userIsNotRole";
import {
    WeekScheduleChangeInstructorArgs,
    WeekScheduleEditArgs,
} from "./args_type/WeekScheduleResolver.args";
import { workoutTypeNotFoundError } from "./WorkoutTypeResolver";
import {getInstructorByIDOrFail} from "../util/getUserByIDOrFail";

export const weekScheduleHasStudentsError = new ApolloError(
    "Clase tiene estudiantes asignados."
);

export const weekScheduleNotFoundError = new ApolloError(
    "Clase no encontrada."
);

export const invalidQuotasError = new ApolloError(
    "No se puede reducir el número de cupos a un número menor del de estudiantes."
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
        @Arg("startDate", () => Date) startDate: Date,
        @Arg("instructorID", () => ID) instructorID: string,
        @Arg("type") workoutType: string
    ): Promise<WeekSchedule> {
        const startDateTime = DateTime.fromJSDate(startDate);
        if (!startDateTime.isValid) {
            throw new ApolloError(
                "Invalid date: ",
                startDateTime.invalidExplanation!
            );
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
        weekSchedule.startDate = startDate;
        weekSchedule.workoutType = Promise.resolve(
            await WorkoutType.findOneOrFail({ name: workoutType })
        );

        weekSchedule = await weekSchedule.save();

        // TODO: return updated instructor field.
        return weekSchedule;
    }

    @Mutation(() => WeekSchedule)
    async weekScheduleAddStudent(
        @Arg("weekScheduleID", () => ID) weekScheduleID: string,
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
        @Arg("weekScheduleID", () => ID) weekScheduleID: string
    ): Promise<boolean> {
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

    /**Edit general info of a WeekSchedule. No modification is performed if any argument is invalid. Requires admin.*/
    @Mutation(() => WeekSchedule)
    @UseMiddleware(RequireAdmin)
    async weekScheduleEdit(
        @Args()
        {
            weekScheduleID,
            days,
            price,
            startDate,
            workoutTypeName,
            instructorID,
            quotas
        }: WeekScheduleEditArgs
    ): Promise<WeekSchedule> {
        const ws = await WeekSchedule.findOne(weekScheduleID);
        if (!ws) throw weekScheduleNotFoundError;

        // Modify
        if (days) ws.days = days;
        if (price !== undefined) ws.price = price;

        if (quotas !== undefined) {
            if (quotas < (await ws.students).length)
                throw invalidQuotasError;

            ws.quotas = quotas;
        }

        // Validate startDate
        if (startDate) {
            const startDateTime = DateTime.fromJSDate(startDate);

            if (!startDateTime.isValid) {
                throw new ApolloError(
                    "Invalid date: " + startDateTime.invalidExplanation
                );
            }

            ws.startDate = startDate;
        }

        // Validate workoutType
        if (workoutTypeName) {
            const wt = await WorkoutType.findOne({ name: workoutTypeName });
            if (!wt) throw workoutTypeNotFoundError;

            ws.workoutType = Promise.resolve(wt);
        }

        // Validate instructor
        if (instructorID) {
            const [, instructor] = await getInstructorByIDOrFail(instructorID);

            ws.instructor = Promise.resolve(instructor);
        }

        return await ws.save();
    }
}
