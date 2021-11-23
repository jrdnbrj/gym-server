import {Resolver, Query} from "type-graphql";

@Resolver()
export class HelloWorldResolver {
    @Query(() => String)
    helloWorld() {
        return "Hello World!";
    }
}
