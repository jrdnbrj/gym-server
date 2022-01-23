import {
    Args,
    Ctx,
    FieldResolver,
    Mutation,
    Resolver,
    ResolverInterface,
    Root,
    UseMiddleware,
} from "type-graphql";
import { HealthRecord } from "../entity/HealthRecord";
import RequireInstructor from "../gql_middleware/RequireInstructor";
import { RegularContext } from "../types/RegularContext";
import { getLoggedInInstructor } from "../util/getLoggedInUser";
import { getClientByIDOrFail } from "../util/getUserByIDOrFail";
import { HealthRecordCreateArgs } from "./args_type/HealthRecordResolver.args";

@Resolver(() => HealthRecord)
export class HealthRecordResolver implements ResolverInterface<HealthRecord> {
    @FieldResolver()
    async _clientField(@Root() hr: HealthRecord) {
        return await hr.client;
    }

    @FieldResolver()
    async _takenByField(@Root() hr: HealthRecord) {
        return await hr.takenBy;
    }

    // Queries and mutations
    @Mutation(() => HealthRecord)
    @UseMiddleware(RequireInstructor)
    async healthRecordCreate(
        @Args()
        {
            clientID,
            height,
            weight,
            pulse,
            systolicPressure,
            diastolicPressure,
        }: HealthRecordCreateArgs,
        @Ctx() { req }: RegularContext
    ): Promise<HealthRecord> {
        const [, instructor] = await getLoggedInInstructor(req);
        const [, client] = await getClientByIDOrFail(clientID);

        const hr = HealthRecord.create({
            height,
            weight,
            pulse,
            systolicPressure,
            diastolicPressure,
        });

        hr.client = Promise.resolve(client);
        hr.takenBy = Promise.resolve(instructor);

        return await hr.save();
    }
}
