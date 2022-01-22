import { FieldResolver, Mutation, Resolver, ResolverInterface, Root } from "type-graphql";
import { HealthRecord } from "../entity/HealthRecord";

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
}
