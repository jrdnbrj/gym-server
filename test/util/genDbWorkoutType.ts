import { WorkoutType } from "../../src/entity/WorkoutType";
import { randomEmoji } from "./randomEmoji";
import { randomUUID } from "crypto";

export const genDbWorkoutType = async (): Promise<WorkoutType> => {
    const wType = new WorkoutType();

    let name = randomUUID();
    let emoji = randomEmoji();

    while (await WorkoutType.findOne({ name })) {
        name = randomUUID();
    }

    while (await WorkoutType.findOne({ emoji })) {
        emoji = randomEmoji();
    }

    wType.name = name;
    wType.emoji = emoji;

    return wType.save();
};
