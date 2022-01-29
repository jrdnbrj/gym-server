import {
    Resolver,
    Query,
    Mutation,
    Arg,
    UseMiddleware,
    ID,
    Args,
    Ctx,
} from "type-graphql";
import { User } from "../entity/User";
import RequireAdmin from "../gql_middleware/RequireAdmin";
import Admin from "../entity/Admin";
import { Client } from "../entity/Client";
import { Instructor } from "../entity/Instructor";
import { userDoesNotExistError } from "../error/userDoesNotExistError";
import { Receipt } from "../entity/Receipt";
import { AdminSubmitPaymentArgs } from "./args_type/AdminResolver.args";
import { DateTime } from "luxon";
import { ApolloError } from "apollo-server-core";
import { WeekSchedule } from "../entity/WeekSchedule";
import { weekScheduleNotFoundError } from "./WeekScheduleResolver";
import sendEmail from "../util/sendEmail";
import { RegularContext } from "../types/RegularContext";
import {getClientByIDOrFail} from "../util/getUserByIDOrFail";

export const clientAlreadyPaidForWSError = new ApolloError(
    "El cliente ya ha pagado la mensualidad de la clase."
);

export const clientNotInWeekScheduleError = new ApolloError(
    "El cliente no es un estudiante de la clase."
);

@Resolver()
export class AdminResolver {
    @Query(() => [User])
    async adminAll(): Promise<User[]> {
        const allAdmins = await Admin.find({});
        return await Promise.all(allAdmins.map(async (a) => await a.user));
    }

    /**Adds given roles to a User. Must be logged as an admin user to use this mutation.*/
    @Mutation(() => User)
    @UseMiddleware(RequireAdmin)
    async adminUserRoles(
        @Arg("userID", () => ID) userID: string,
        @Arg("isClient", { nullable: true }) isClient?: boolean,
        @Arg("isInstructor", { nullable: true }) isInstructor?: boolean,
        @Arg("isAdmin", { nullable: true }) isAdmin?: boolean
    ): Promise<User> {
        // Change privileges
        let user = await User.findOne(userID);
        if (!user) {
            throw userDoesNotExistError;
        }

        if (isClient !== undefined && isClient !== null) {
            const currentClient = await user.client;

            if (isClient && !currentClient) {
                user.client = Promise.resolve(new Client());
            }

            if (!isClient) {
                if (currentClient) await currentClient.remove();

                user.client = Promise.resolve(null);
            }
        }

        if (isInstructor !== undefined && isInstructor !== null) {
            const currentInst = await user.instructor;

            if (isInstructor && !currentInst) {
                user.instructor = Promise.resolve(new Instructor());
            }

            if (!isInstructor) {
                await user.deleteInstructorRole();
            }
        }

        if (isAdmin !== undefined && isAdmin !== null) {
            const currentAdmin = await user.admin;

            if (isAdmin && !currentAdmin) {
                user.admin = Promise.resolve(new Admin());
            }

            if (!isAdmin) {
                if (currentAdmin) await currentAdmin.remove();

                user.admin = Promise.resolve(null);
            }
        }

        // TODO: admin is null if assigning to user.
        // TODO: No assignment causes DEP0005: Buffer() is deprecated.
        await user.save();

        return user;
    }

    /**Creates a receipt for a client's monthly reservation. It allows to pay in advance.*/
    @Mutation(() => [Receipt])
    @UseMiddleware(RequireAdmin)
    async adminSubmitPayment(
        @Args() { weekScheduleID, clientID, months }: AdminSubmitPaymentArgs
    ): Promise<Receipt[]> {
        if (!months) months = 1;

        // Get client
        const [clientUser, client] = await getClientByIDOrFail(clientID);

        // Get weekSchedule
        const weekSchedule = await WeekSchedule.findOne(weekScheduleID);
        if (!weekSchedule) throw weekScheduleNotFoundError;

        const students = await weekSchedule.students;
        const studentsClientIDs = students.map((s) => s.id);

        // Assert client has reserved the given weekSchedule
        if (studentsClientIDs.indexOf(client.id) < 0) {
            throw clientNotInWeekScheduleError;
        }

        const monthDates: DateTime[] = [];
        for (let i = 0; i < months; i++) {
            monthDates.push(DateTime.local().plus({ months: i }));
        }

        // Check if client already has paid for those months
        for (const md of monthDates) {
            if (await client.hasPaidFor(weekScheduleID, md)) {
                throw clientAlreadyPaidForWSError;
            }
        }

        // Generate receipt
        const receipts: Receipt[] = [];

        for (const md of monthDates) {
            const receipt = await Receipt.create({
                totalAmount: weekSchedule.price,
                clientID: clientID,
                clientFullName: clientUser.fullName(),
                clientEmail: clientUser.email,
                weekScheduleID,
                workoutTypeName: (await weekSchedule.workoutType).name,
                paidForMonthsDates: [md.toJSDate()],
            }).save();

            receipts.push((await Receipt.findOne(receipt.id))!);
        }

        return receipts;
    }

    @Mutation(() => Boolean)
    @UseMiddleware(RequireAdmin)
    async adminSendEmailAllUsers(
        @Arg("subject") subject: string,
        @Arg("text") text: string,
        @Ctx() { transporter }: RegularContext
    ): Promise<boolean> {
        const users = await User.find();

        for (const user of users) {
            await sendEmail(transporter, {
                to: user.email,
                subject,
                html: `<p>${text}</p>`,
            });
        }

        return true;
    }
}
