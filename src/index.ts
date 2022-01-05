import "reflect-metadata";
import { createConnection } from "typeorm";
import connectionOptions from "../ormconfig";
import { ApolloServer, ApolloServerExpressConfig } from "apollo-server-express";
import * as express from "express";
import {
    ApolloServerPluginLandingPageGraphQLPlayground,
    ApolloServerPluginLandingPageDisabled,
} from "apollo-server-core";
import {
    __prod__,
    SESSION_SECRET,
    SMTP_HOST,
    SMTP_USER,
    SMTP_PASSWORD,
} from "./constants";
import * as session from "express-session";
import cookieParser = require("cookie-parser");
import { RegularContext } from "./types/RegularContext";
import { buildGqlSchema } from "./util/buildGqlSchema";
import * as nodemailer from "nodemailer";

declare module "express-session" {
    interface SessionData {
        userId: number;
    }
}

const main = async () => {
    const db = await createConnection(connectionOptions);
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
    const PORT = 8000;

    // Express middleware
    app.use(cookieParser());

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
                sameSite: "lax",
            },
        })
    );

    // Configure Apollo Server
    const schema = await buildGqlSchema();
    // TODO: Find a more elegant  approach to passing apolloServerConfig, as
    // new ApolloServer() seems to receive a config parameter of type any in
    // Apollo 3.
    const apolloServerConfig: ApolloServerExpressConfig = {
        schema,
        plugins: [
            __prod__
                ? ApolloServerPluginLandingPageDisabled()
                : ApolloServerPluginLandingPageGraphQLPlayground({
                      settings: {
                          "request.credentials": "include",
                      },
                  }),
        ],
        context: ({ req, res }): RegularContext => ({
            req,
            res,
            db,
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
            origin: "http://localhost:3000", // TODO: Client url as env variable.
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
