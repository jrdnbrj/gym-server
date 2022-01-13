import { ArgsType, Field } from "type-graphql";

@ArgsType()
export class UserInfoInput {
    @Field({ nullable: true })
    firstName?: string;

    @Field({ nullable: true })
    lastName?: string;

    @Field({ nullable: true })
    email?: string;
}
