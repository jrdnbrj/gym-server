import {
    BaseEntity,
    Entity,
    ManyToMany,
    OneToMany,
    OneToOne,
    PrimaryGeneratedColumn,
} from "typeorm";
import { ObjectType, Field } from "type-graphql";
import { User } from "./User";
import { WeekSchedule } from "./WeekSchedule";
import { DateTime } from "luxon";
import { Receipt } from "./Receipt";
import { HealthRecord } from "./HealthRecord";

@Entity()
@ObjectType()
export class Client extends BaseEntity {
    @PrimaryGeneratedColumn()
    id!: number;

    @OneToOne(() => User, (user) => user.client, { onDelete: "CASCADE" })
    user!: Promise<User>;

    @ManyToMany(() => WeekSchedule, (ws) => ws.students)
    weekSchedules!: Promise<WeekSchedule[]>;

    @Field(() => [WeekSchedule], { name: "weekSchedules" })
    _weekSchedulesField!: WeekSchedule[];

    @OneToMany(() => HealthRecord, (hr) => hr.client)
    healthRecords!: Promise<HealthRecord[]>;

    @Field(() => [HealthRecord], { name: "healthRecords" })
    _healthRecordsField!: HealthRecord[];

    // Methods
    /**Checks if client has already paid for a given weekSchedule in a given month and year. If `monthDate` is undefined, it defaults to current month.*/
    async hasPaidFor(
        weekScheduleID: string,
        monthDate?: DateTime
    ): Promise<boolean> {
        if (!monthDate) monthDate = DateTime.local();

        // Find receipts with same weekScheduleID and clientID.
        let receipts = await Receipt.find({
            where: { weekScheduleID, clientID: (await this.user).id },
        });

        // Find if any receipt has a payment for the given month.
        return receipts.some((r) => {
            const receiptDates = r.paidForMonthsDates.map((d) =>
                DateTime.fromJSDate(d)
            );

            for (const date of receiptDates) {
                if (
                    date.month == monthDate!.month &&
                    date.year == monthDate!.year
                )
                    return true;
            }

            return false;
        });
    }
}
