import { ArgsType, Field, ID } from "type-graphql";

@ArgsType()
export class ReceiptAllArgs {
    @Field(() => ID, { nullable: true })
    clientID?: string;
}
