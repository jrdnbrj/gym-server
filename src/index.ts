import "reflect-metadata";
import {createConnection} from "typeorm";
import connectionOptions from "../ormconfig";
import {ApolloServer} from "apollo-server-express";
import {buildSchema} from "type-graphql"
import * as express from "express";
import {ApolloServerPluginLandingPageGraphQLPlayground, ApolloServerPluginLandingPageDisabled} from "apollo-server-core";
import {__prod__} from "./constants";

const main = async () => {
    await createConnection(connectionOptions);
    console.log("\nDatabase connection successfull!");

    const app = express();
    const PORT = 8000;

    const schema = await buildSchema(
        {
            resolvers: [__dirname + "/resolver/**/*.ts"]
        }
    );

    const apolloServer = new ApolloServer({
        schema,
        plugins: [
            __prod__
                ? ApolloServerPluginLandingPageDisabled()
                : ApolloServerPluginLandingPageGraphQLPlayground(),
        ]
    });

    await apolloServer.start();
    apolloServer.applyMiddleware({
        app
    });

    // Endpoints
    app.get("/", (_req, res) => {
        res.send("Hello World!");
    });

    // Listen
    app.listen(PORT, () => {
        console.log(`⚡️[server]: Server listening on localhost:${PORT}`);
    })
}

main().catch(e => console.error(e));
