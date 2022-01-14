import { ApolloError } from "apollo-server-core";
import { Arg, Mutation, Query, Resolver } from "type-graphql";
import { WeekSchedule } from "../entity/WeekSchedule";
import { WorkoutType } from "../entity/WorkoutType";
import { isEmoji } from "../util/isEmoji";

export const invalidEmojiError = new ApolloError("Ingresa un emoji válido.");
export const workoutTypeNotFoundError = new ApolloError(
    "Tipo de clase no encontrado."
);
export const workoutTypeNameTakenError = new ApolloError(
    "Ya existe una clase con ese nombre."
);
export const workoutTypeEmojiTakenError = new ApolloError(
    "Ya existe una clase con el mismo emoji"
);
export const workoutTypeReferencedError = new ApolloError(
    "Tipo de clase referenciado en clases existentes. Elimine esas clases primero."
);

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
        if (await WorkoutType.findOne({ name })) {
            throw workoutTypeNameTakenError;
        }

        if (!isEmoji(emoji)) {
            throw invalidEmojiError;
        }

        if (await WorkoutType.findOne({ emoji }))
            throw workoutTypeEmojiTakenError;

        return await WorkoutType.create({
            name,
            emoji,
        }).save();
    }

    @Mutation(() => WorkoutType)
    async workoutTypeEdit(
        @Arg("originalName") originalName: string,
        @Arg("newName", { nullable: true }) newName?: string,
        @Arg("newEmoji", { nullable: true }) newEmoji?: string
    ) {
        const wt = await WorkoutType.findOne({ name: originalName });

        if (!wt) throw workoutTypeNotFoundError;

        if (newName) {
            if (await WorkoutType.findOne({ name: newName }))
                throw workoutTypeNameTakenError;

            wt.name = newName;
        }

        if (newEmoji && wt.emoji !== newEmoji) {
            if (await WorkoutType.findOne({ emoji: newEmoji }))
                throw workoutTypeEmojiTakenError;

            if (!isEmoji(newEmoji)) throw invalidEmojiError;

            wt.emoji = newEmoji;
        }

        return await wt.save();
    }

    /**Deletes a WorkoutType given its name, and all of its associated WeekSchedules. Returns true if successful, otherwise it throws an error.*/
    // FIXME: should not cascade.
    @Mutation(() => Boolean)
    async workoutTypeDelete(@Arg("name") name: string) {
        const wt = await WorkoutType.findOne({ name });
        if (!wt) throw workoutTypeNotFoundError;

        const relatedWs = await WeekSchedule.find({
            where: {
                workoutType: wt,
            },
        });

        if (relatedWs.length > 0) {
            throw workoutTypeReferencedError;
        }

        await wt.remove();
        return true;
    }
}
