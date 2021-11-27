import { Resolver, Query } from "type-graphql";
import { WorkoutClass } from "../entity/WorkoutClass";
import { getWorkoutClasses } from "../services/workoutClass";

@Resolver()
export class WorkoutClassResolver {
    @Query(() => [WorkoutClass])
    async getWorkoutClasses() {
        return getWorkoutClasses();
    }
}
