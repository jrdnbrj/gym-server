import { Resolver, Ctx, Query } from "type-graphql";
import { RegularContext } from "../types/RegularContext";
import Admin from "../entity/Admin";

@Resolver()
export class AdminResolver {
    @Query(() => [Admin])
    async adminAll(@Ctx() { db }: RegularContext): Promise<Admin[]> {
        return await db.manager.find(Admin, {});
    }
}
