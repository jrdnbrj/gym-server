import { WorkoutType } from "../../src/entity/WorkoutType";
import { randomEmoji } from "./randomEmoji";
import { randomUUID } from "crypto";

export const genDbWorkoutType = async (
    duplicateCheckArray?: WorkoutType[]
): Promise<WorkoutType> => {
    let wType = new WorkoutType();

    wType.name = randomUUID();
    wType.emoji = randomEmoji();

    if (duplicateCheckArray) {
        while (
            duplicateCheckArray.map((t) => t.emoji).indexOf(wType.emoji) >= 0
        )
            wType.emoji = randomEmoji();
    }

    return wType.save();
};
