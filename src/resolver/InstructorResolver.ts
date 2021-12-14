import {
    Resolver,
    Query,
    Mutation,
    Arg,
    Ctx,
    UseMiddleware,
} from "type-graphql";
import { Instructor } from "../entity/Instructor";
import { User } from "../entity/User";
import { ApolloError } from "apollo-server-core";
import { RegularContext } from "../types/RegularContext";
import { WeekSchedule } from "../entity/WeekSchedule";
import sendEmail from "../util/sendEmail";
import { Not } from "typeorm";
import RequireInstructor from "../gql_middleware/RequireInstructor";

declare module "express-session" {
    interface SessionData {
        userId: number;
    }
}

@Resolver()
export class InstructorResolver {
    @Mutation(() => User)
    async instructorRegister(
        @Arg("userID") userID: number,
        @Ctx() { db }: RegularContext
    ): Promise<User> {
        let user = await db.manager.findOne(User, userID);

        if (!user) {
            throw new ApolloError("User not found.");
        }

        const instructor = new Instructor();

        user.instructor = instructor;
        user = await db.manager.save(user);

        return user;
    }

    @Query(() => [User])
    async instructorAll(@Ctx() { db }: RegularContext): Promise<User[]> {
        return await db.manager.find(User, {
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
        @Ctx() { db, req }: RegularContext
    ): Promise<boolean> {
        const instructorUser = (await db.manager.findOne(
            User,
            req.session.userId!
        ))!;

        const scheduleOfInstructorIndex =
            instructorUser.instructor.weekSchedules
                .map((w) => w.id)
                .indexOf(weekScheduleID);

        // TODO: weird error here.
        if (scheduleOfInstructorIndex < 0)
            throw new ApolloError("WeekSchedule not taught by instructor.");

        const weekSchedule = await db.manager.findOne(
            WeekSchedule,
            weekScheduleID
        );
        if (!weekSchedule) {
            // Clean erroneous data.
            instructorUser.instructor.weekSchedules.splice(
                scheduleOfInstructorIndex,
                1
            );
            await db.manager.save(instructorUser);

            throw new ApolloError("WeekSchedule does not exist.");
        }

        for (let clientUser of weekSchedule.students) {
            await sendEmail(
                clientUser.email,
                `Aviso de ${instructorUser.firstName} ${instructorUser.lastName}`,
                `<p>${message}</p>`
            );
        }

        return true;
    }
}
