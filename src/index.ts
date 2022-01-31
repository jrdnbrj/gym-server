import "reflect-metadata";
import { createConnection } from "typeorm";
import connectionOptions from "../ormconfig";
import { ApolloServer, ApolloServerExpressConfig } from "apollo-server-express";
import express from "express";
import {
    __prod__,
    SESSION_SECRET,
    SMTP_HOST,
    SMTP_USER,
    SMTP_PASSWORD,
    PORT
} from "./constants";
import session from "express-session";
import { RegularContext } from "./types/RegularContext";
import { buildGqlSchema } from "./util/buildGqlSchema";
import * as nodemailer from "nodemailer";
import FileStore from "session-file-store";

declare module "express-session" {
    interface SessionData {
        userId: string;
    }
}

const main = async () => {
    await createConnection(connectionOptions);
    console.log("\nDatabase connection successfull!");

    // Email transporter
    // Configured for Heroku's CloudMailin or Gmail SMTP.
    const transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: 587,
        secure: false,
        requireTLS: true,
        auth: {
            user: SMTP_USER,
            pass: SMTP_PASSWORD,
        },
    });

    const app = express();

    // Express middleware
    const oneDayMs = 1000 * 60 * 60 * 24;
    app.use(
        session({
            secret: SESSION_SECRET,
            resave: false,
            saveUninitialized: false,
            cookie: {
                maxAge: oneDayMs,
                secure: __prod__,
                httpOnly: __prod__,
                sameSite: __prod__ ? "none" : "lax",
            },
            store: __prod__? new (FileStore(session))() : undefined,
            proxy: true
        })
    );

    // Configure Apollo Server
    const schema = await buildGqlSchema();
    // TODO: Find a more elegant  approach to passing apolloServerConfig, as
    // new ApolloServer() seems to receive a config parameter of type any in
    // Apollo 3.
    const apolloServerConfig: ApolloServerExpressConfig = {
        schema,
        context: ({ req, res }): RegularContext => ({
            req,
            res,
            transporter,
        }),
        cache: undefined,
        debug: undefined,
        logger: undefined,
        dataSources: undefined,
        formatError: undefined,
        fieldResolver: undefined,
        rootValue: undefined,
        formatResponse: undefined,
        validationRules: undefined,
        executor: undefined,
        allowBatchedHttpRequests: undefined,
    };

    const apolloServer = new ApolloServer(apolloServerConfig);

    await apolloServer.start();
    apolloServer.applyMiddleware({
        app,
        cors: {
            credentials: true,
            origin: ["http://localhost:3000", "https://studio.apollographql.com"], // TODO: Client url as env variable.
        },
    });

    // Endpoints
    app.get("/", (_req, res) => {
        res.send("Hello World!");
    });

    // Listen
    app.listen(PORT, () => {
        console.log(`⚡️[server]: Server listening on localhost:${PORT}`);
    });
};

main().catch((e) => console.error(e));
