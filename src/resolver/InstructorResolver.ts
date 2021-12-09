import { Resolver, Query, Mutation, Arg, Ctx } from "type-graphql";
import { Instructor } from "../entity/Instructor";
import { User } from "../entity/User";
import { ApolloError } from "apollo-server-core";
import { RegularContext } from "../types/RegularContext";
import { WeekSchedule } from "../entity/WeekSchedule";
import sendEmail from "../util/sendEmail";

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
        const user = await db.manager.findOne(User, userID, {
            relations: ["instructor"],
        });

        if (!user) {
            throw new ApolloError("User not found.");
        }

        const instructor = new Instructor();
        instructor.userID = user.id;
        await db.manager.save(instructor);

        user.instructor = instructor;
        await db.manager.save(user);

        return user;
    }

    @Query(() => [Instructor])
    async instructorAll(@Ctx() { db }: RegularContext): Promise<Instructor[]> {
        return await db.manager.find(Instructor);
    }

    /**Sends an email to all students from a given weekSchedule.*/
    @Mutation(() => Boolean)
    async instructorSendEmailWeekSchedule(
        @Arg("weekScheduleID") weekScheduleID: number,
        @Arg("message") message: string,
        @Ctx() { db, req }: RegularContext
    ): Promise<boolean> {
        const userID = req.session.userId;
        if (!userID) throw new ApolloError("Not logged in.");

        const instructor = await db.manager.findOne(Instructor, {
            userID: userID,
        });
        if (!instructor) throw new ApolloError("User is not an instructor.");

        const scheduleOfInstructorIndex =
            instructor.weekScheduleIDs.indexOf(weekScheduleID);

        if (scheduleOfInstructorIndex < 0)
            throw new ApolloError("WeekSchedule not taught by instructor.");

        const weekSchedule = await db.manager.findOne(
            WeekSchedule,
            weekScheduleID
        );
        if (!weekSchedule) {
            // Clean erroneous data.
            instructor.weekScheduleIDs.splice(scheduleOfInstructorIndex, 1);
            await db.manager.save(instructor);

            throw new ApolloError("WeekSchedule does not exist.");
        }

        for (let id of weekSchedule.students.map((s) => s.userID)) {
            let clientUser = await db.manager.findOne(User, id);

            if (!clientUser) continue;

            const email = clientUser.email;

            await sendEmail(
                email,
                `Aviso de ${clientUser.firstName} ${clientUser.lastName}`,
                `<p>${message}</p>`
            );
        }

        return true;
    }
}
