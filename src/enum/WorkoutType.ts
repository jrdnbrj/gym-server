import { registerEnumType } from "type-graphql";

enum WorkoutType {
    Aerobics,
    Stength,
    Stretch,
    Balance,
    MartialArts,
}

registerEnumType(WorkoutType, {
    name: "WorkoutType",
    description: "Type of workout done in workoutClasses",
});

export default WorkoutType;
