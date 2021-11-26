import { MonthlyClasses } from '../entity/MonthlyClasses';

export const getMonthlyClasses = async (): Promise<MonthlyClasses[]> => {
    return await MonthlyClasses.find();
};
