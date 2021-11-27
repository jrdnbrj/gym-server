import { WorkoutClass } from '../entity/WorkoutClass';

export const getWorkoutClasses = async (): Promise<WorkoutClass[]> => {
    return await WorkoutClass.find();
};
