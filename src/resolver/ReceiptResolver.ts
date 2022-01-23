import { Args, Query, Resolver } from "type-graphql";
import { Receipt } from "../entity/Receipt";
import { ReceiptAllArgs } from "./args_type/ReceiptResolver.args";

@Resolver(() => Receipt)
export class ReceiptResolver {
    @Query(() => [Receipt])
    async receiptAll(@Args() { clientID }: ReceiptAllArgs): Promise<Receipt[]> {
        if (clientID) {
            return await Receipt.find({ where: { clientID } });
        }

        return await Receipt.find();
    }
}
