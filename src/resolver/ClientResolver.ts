import { Resolver, Query, Mutation, Arg, Ctx } from "type-graphql";
import { Client } from "../entity/Client";
import { User } from "../entity/User";
import { ApolloError } from "apollo-server-core";
import { RegularContext } from "../types/RegularContext";

@Resolver()
export class ClientResolver {
    @Mutation(() => User)
    async clientRegister(
        @Arg("userID") userID: number,
        @Ctx() { db }: RegularContext
    ): Promise<User> {
        const user = await db.manager.findOne(User, userID);

        if (!user) {
            throw new ApolloError("User not found.");
        }

        const client = new Client();
        client.userID = user.id;
        await db.manager.save(client);

        user.client = client;
        await db.manager.save(user);

        return user;
    }

    @Query(() => [Client])
    async clientAll(@Ctx() { db }: RegularContext): Promise<Client[]> {
        return await db.manager.find(Client);
    }
}
