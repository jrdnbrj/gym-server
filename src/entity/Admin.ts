import { ObjectType, Field } from "type-graphql";
import { Column } from "typeorm";

@ObjectType()
class Admin {
    @Column({ default: "debugging" })
    @Field()
    _placeholder!: string;
}

export default Admin;
