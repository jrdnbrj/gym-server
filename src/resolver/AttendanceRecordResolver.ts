import {
    Resolver,
    FieldResolver,
    ResolverInterface,
    Root,
    Query,
    Ctx,
    Mutation,
    Arg,
    ID,
    Float,
} from "type-graphql";
import { AttendanceRecord } from "../entity/AttendanceRecord";
import { RegularContext } from "../types/RegularContext";
import intAsWeekday from "../util/intAsWeekday";
import { ApolloError } from "apollo-server-core";
import { WeekSchedule } from "../entity/WeekSchedule";
import dateWithoutTime from "../util/dateWithoutTime";

@Resolver(() => AttendanceRecord)
export class AttendanceRecordResolver
    implements ResolverInterface<AttendanceRecord>
{
    @FieldResolver()
    attendanceField(@Root() record: AttendanceRecord) {
        return record.attendance;
    }

    /**Returns all attendanceRecords. Results can be filtered given a weekScheduleID.*/
    @Query(() => [AttendanceRecord])
    async attendanceRecordAll(
        @Arg("weekScheduleID", () => ID, {
            defaultValue: null,
            nullable: true,
        })
        weekScheduleID: number | null,
        @Ctx() { db }: RegularContext
    ): Promise<AttendanceRecord[]> {
        const found = await db.manager.find(
            AttendanceRecord,
            weekScheduleID
                ? {
                      relations: ["weekSchedule"],
                      where: { weekSchedule: { id: weekScheduleID } },
                  }
                : {}
        );
        return found;
    }

    /** Creates a new AttendanceRecord for the current date with all students `attended` as `true`.*/
    @Mutation(() => AttendanceRecord)
    async attendanceRecordCreate(
        @Arg("weekScheduleID") weekScheduleID: number,
        @Ctx() { db }: RegularContext
    ): Promise<AttendanceRecord> {
        // TODO: Fix wrong today's weekDay bug. Related to Docker container.
        const weekSchedule = await db.manager.findOne(
            WeekSchedule,
            weekScheduleID
        );
        if (!weekSchedule) throw new ApolloError("WeekSchedule not found.");

        // Validate date and day.
        const today = dateWithoutTime(new Date());
        const todayWeekday = intAsWeekday(today.getDay());

        if (
            today.getMilliseconds() < weekSchedule.startDate.getMilliseconds()
        ) {
            throw new ApolloError("WeekSchedule hasn't started yet.");
        }

        if (weekSchedule.days.indexOf(todayWeekday) < 0) {
            throw new ApolloError(
                "AttendanceRecords can only be modified on the same day as the given WeekSchedule."
            );
        }

        if (
            await db.manager.findOne(AttendanceRecord, {
                relations: ["weekSchedule"],
                where: { weekSchedule: { id: weekScheduleID }, date: today },
            })
        ) {
            throw new ApolloError(
                "AttendanceRecord has already been created for today."
            );
        }
        // Create record.
        const record = new AttendanceRecord();
        record.weekSchedule = weekSchedule;
        record.date = today;

        const attendance: typeof record.attendance = [];

        for (let student of weekSchedule.students) {
            attendance.push({ studentID: student.id, attended: true });
        }

        record.attendance = attendance;

        // Save
        await db.manager.save(record);

        return record;
    }

    private async _attendanceRecordSetAttended(
        attendedValue: boolean,
        weekScheduleID: number,
        notAssistedIDs: number[],
        { db }: RegularContext
    ): Promise<AttendanceRecord> {
        const today = dateWithoutTime(new Date());

        const record = await db.manager.findOne(AttendanceRecord, {
            relations: ["weekSchedule"],
            where: { weekSchedule: { id: weekScheduleID }, date: today },
        });

        if (!record) {
            throw new ApolloError(
                "No AttendanceRecord has been created for today. Create an AttendanceRecord first."
            );
        }

        const studentIDs = record.attendance.map((unit) => unit.studentID);

        for (let id of notAssistedIDs) {
            const studentIndex = studentIDs.indexOf(id);

            if (studentIndex < 0) {
                throw new ApolloError(
                    `Student with ID ${id} is not part of today's AttendanceRecord.`
                );
            }

            record.attendance[studentIndex].attended = attendedValue;
        }

        await db.manager.save(record);
        return record;
    }

    /**Sets the given students' attendance to false in today's WeekSchedule's AttendanceRecord. AttendanceRecord must be created previously.*/
    @Mutation(() => AttendanceRecord)
    async attendanceRecordSetNotAssisted(
        @Arg("weekScheduleID") weekScheduleID: number,
        @Arg("notAssistedIDs", () => [Float]) notAssistedIDs: number[],
        @Ctx() context: RegularContext
    ): Promise<AttendanceRecord> {
        return this._attendanceRecordSetAttended(
            false,
            weekScheduleID,
            notAssistedIDs,
            context
        );
    }

    /**Sets the given students' attendance to true in today's WeekSchedule's AttendanceRecord. AttendanceRecord must be created previously.*/
    @Mutation(() => AttendanceRecord)
    async attendanceRecordSetAssisted(
        @Arg("weekScheduleID") weekScheduleID: number,
        @Arg("notAssistedIDs", () => [Float]) notAssistedIDs: number[],
        @Ctx() context: RegularContext
    ): Promise<AttendanceRecord> {
        return this._attendanceRecordSetAttended(
            true,
            weekScheduleID,
            notAssistedIDs,
            context
        );
    }
}
