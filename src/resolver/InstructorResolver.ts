import {
    Resolver,
    Query,
    Mutation,
    Arg,
    Ctx,
    UseMiddleware,
    ID,
    FieldResolver,
    ResolverInterface,
    Root,
} from "type-graphql";
import { Instructor } from "../entity/Instructor";
import { User } from "../entity/User";
import { ApolloError } from "apollo-server-core";
import { RegularContext } from "../types/RegularContext";
import { WeekSchedule } from "../entity/WeekSchedule";
import sendEmail from "../util/sendEmail";
import RequireInstructor from "../gql_middleware/RequireInstructor";

declare module "express-session" {
    interface SessionData {
        userId: string;
    }
}

@Resolver(() => Instructor)
export class InstructorResolver implements ResolverInterface<Instructor> {
    @FieldResolver()
    async _weekSchedulesField(@Root() instructor: Instructor) {
        return await instructor.weekSchedules;
    }

    @Mutation(() => User)
    async instructorRegister(
        @Arg("userID", () => ID) userID: string
    ): Promise<User> {
        let user = await User.findOne(userID);

        if (!user) {
            throw new ApolloError("User not found.");
        }

        if (await user.instructor)
            throw new ApolloError("Usuario ya es un instructor.");

        user.instructor = Promise.resolve(new Instructor());
        user = await user.save();

        return user;
    }

    @Query(() => [User])
    async instructorAll(): Promise<User[]> {
        const instructors = await Instructor.find({});

        return await Promise.all(instructors.map(async (i) => await i.user));
    }

    // TODO: Change return value
    /**Sends an email to all students from a given weekSchedule.*/
    @Mutation(() => Boolean)
    @UseMiddleware(RequireInstructor)
    async instructorSendEmailWeekSchedule(
        @Arg("weekScheduleID") weekScheduleID: number,
        @Arg("message") message: string,
        @Ctx() { req, transporter }: RegularContext
    ): Promise<boolean> {
        const instructorUser = (await User.findOne(req.session.userId!))!;
        const instructor = (await instructorUser.instructor)!;

        const scheduleOfInstructorIndex = (await instructor.weekSchedules)
            .map((w) => w.id)
            .indexOf(weekScheduleID);

        // TODO: weird error here.
        if (scheduleOfInstructorIndex < 0)
            throw new ApolloError("WeekSchedule not taught by instructor.");

        const weekSchedule = await WeekSchedule.findOne(weekScheduleID);
        if (!weekSchedule) {
            // Clean erroneous data.
            (await instructor.weekSchedules).splice(
                scheduleOfInstructorIndex,
                1
            );
            await instructorUser.save();

            throw new ApolloError("WeekSchedule does not exist.");
        }

        for (let clientUser of weekSchedule.students) {
            await sendEmail(transporter, {
                to: clientUser.email,
                subject: `Aviso de ${instructorUser.firstName} ${instructorUser.lastName}`,
                html: `<p>${message}</p>`,
            });
        }

        return true;
    }
}
