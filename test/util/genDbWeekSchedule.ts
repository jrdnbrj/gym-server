import { Client } from "../../src/entity/Client";
import { User } from "../../src/entity/User";
import { WeekSchedule } from "../../src/entity/WeekSchedule";
import { WorkoutType } from "../../src/entity/WorkoutType";
import { Weekday } from "../../src/enum/Weekday";
import { genDbUser } from "./genDbUser";
import { genDbWorkoutType } from "./genDbWorkoutType";
import { randomDate } from "./randomDate";

interface GenOptions {
    workoutType?: WorkoutType;
    instructor?: User;
    genRandomStudents?: boolean;
}

/**Generates a new WeekSchedules and saves it in the database.
 *
 * If no workoutType is given, a new random one is created. If `genRandomStudents = flse`, then the result will have no students.
 */
export const genDbWeekSchedule = async (
    options: GenOptions = {}
): Promise<WeekSchedule> => {
    const weekDays = [
        Weekday.Monday,
        Weekday.Tuesday,
        Weekday.Wednesday,
        Weekday.Thursday,
        Weekday.Friday,
        Weekday.Saturday,
        Weekday.Sunday,
    ];

    const nDays = Math.floor(Math.random() * (weekDays.length + 1));
    const shuffledWeekdays = weekDays.sort(() => 0.5 - Math.random());

    const days = shuffledWeekdays.slice(0, nDays);

    const startDate = randomDate(new Date(2003, 9, 2), new Date());

    const ws = WeekSchedule.create({
        days,
        startDate,
        students: Promise.resolve([]),
    });

    // Optional arguments
    const { workoutType, instructor, genRandomStudents } = options;

    if (genRandomStudents) {
        const randomStudents: Client[] = [];

        // random n in [1, 3]
        let n = Math.floor(Math.random() * 3) + 1;
        for (let i = 0; i < n; i++) {
            const newUser = await genDbUser({ isClient: true });
            randomStudents.push((await newUser.client)!);
        }

        ws.students = Promise.resolve(randomStudents);
    }

    if (workoutType) ws.workoutType = Promise.resolve(workoutType);
    else {
        ws.workoutType = Promise.resolve(await genDbWorkoutType());
    }

    if (instructor)
        ws.instructor = Promise.resolve((await instructor.instructor)!);
    else {
        const newUser = await genDbUser({ isInstructor: true });
        ws.instructor = Promise.resolve((await newUser.instructor)!);
    }

    return await ws.save();
};
