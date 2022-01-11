import {
    Resolver,
    Query,
    Mutation,
    Arg,
    Ctx,
    UseMiddleware,
    ID,
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

@Resolver()
export class InstructorResolver {
    @Mutation(() => User)
    async instructorRegister(
        @Arg("userID", () => ID) userID: string
    ): Promise<User> {
        let user = await User.findOne(userID);

        if (!user) {
            throw new ApolloError("User not found.");
        }

        const instructor = new Instructor();

        user.instructor = instructor;
        user = await user.save();

        return user;
    }

    @Query(() => [User])
    async instructorAll(): Promise<User[]> {
        return await User.find({
            where: { isInstructor: true },
        });
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
        const instructorUser = (await User.findOne(req.session.userId!, {
            relations: ["instructor.weekSchedules"],
        }))!;

        const scheduleOfInstructorIndex =
            instructorUser.instructor.weekSchedules
                .map((w) => w.id)
                .indexOf(weekScheduleID);

        // TODO: weird error here.
        if (scheduleOfInstructorIndex < 0)
            throw new ApolloError("WeekSchedule not taught by instructor.");

        const weekSchedule = await WeekSchedule.findOne(weekScheduleID);
        if (!weekSchedule) {
            // Clean erroneous data.
            instructorUser.instructor.weekSchedules.splice(
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
