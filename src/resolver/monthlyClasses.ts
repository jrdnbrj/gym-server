import { Resolver, Query } from "type-graphql";
import { MonthlyClasses } from "../entity/MonthlyClasses";
import { getMonthlyClasses } from "../services/monthlyClasses";

@Resolver()
export class MonthlyClassesResolver {
    @Query(() => [MonthlyClasses])
    async getMonthlyClasses() {
        return getMonthlyClasses();
    }
}
