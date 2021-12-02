import { Resolver, Query, Mutation, Arg, Ctx } from "type-graphql";
import { Instructor } from "../entity/Instructor";
import { User } from "../entity/User";
import { ApolloError } from "apollo-server-core";
import { RegularContext } from "../types/RegularContext";

@Resolver()
export class InstructorResolver {
    @Mutation(() => User)
    async instructorRegister(
        @Arg("userID") userID: number,
        @Ctx() { db }: RegularContext
    ): Promise<User> {
        const user = await db.manager.findOne(User, userID, {
            relations: ["instructor"],
        });

        if (!user) {
            throw new ApolloError("User not found.");
        }

        const instructor = new Instructor();
        instructor.userID = user.id;
        await db.manager.save(instructor);

        user.instructor = instructor;
        await db.manager.save(user);

        return user;
    }

    @Query(() => [Instructor])
    async instructorAll(@Ctx() { db }: RegularContext): Promise<Instructor[]> {
        return await db.manager.find(Instructor);
    }
}
