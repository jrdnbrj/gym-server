import "reflect-metadata";
import {createConnection} from "typeorm";
import connectionOptions from "../ormconfig";
import * as express from "express";

const main = async () => {
    await createConnection(connectionOptions);
    console.log("\nDatabase connection successfull!");

    const app = express();
    const PORT = 8000;

    // Endpoints
    app.get("/", (_req, res) => {
        res.send("Hello World!");
    });

    // Listen
    app.listen(PORT, () => {
        console.log(`⚡️[server]: Server listening on localhost:${PORT}`);
    })
}

main();
