import { ApolloError } from "apollo-server-core";
import { Arg, Mutation, Query, Resolver } from "type-graphql";
import { WorkoutType } from "../entity/WorkoutType";
import { isEmoji } from "../util/isEmoji";

@Resolver()
export class WorkoutTypeResolver {
    @Query(() => [WorkoutType])
    async workoutTypeAll(): Promise<WorkoutType[]> {
        return await WorkoutType.find({});
    }

    /**Creates a new WorkoutType. Emoji must be a length-1 string with the Unicode representation of the emoji.*/
    @Mutation(() => WorkoutType)
    async workoutTypeCreate(
        @Arg("name") name: string,
        @Arg("emoji") emoji: string
    ): Promise<WorkoutType> {
        if (await WorkoutType.findOne(name)) {
            throw new ApolloError(
                "WorkoutType with given name already exists."
            );
        }

        if (!isEmoji(emoji)) {
            throw new ApolloError("Invalid emoji.");
        }

        if (await WorkoutType.findOne({ emoji }))
            throw new ApolloError(
                "WorkoutType with given emoji already exists."
            );

        return await WorkoutType.create({
            name,
            emoji,
        }).save();
    }
}
