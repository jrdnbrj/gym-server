import * as path from "path";
import { ConnectionOptions } from "typeorm";
import { DATABASE_URL } from "./src/constants";

const connectionOptions: ConnectionOptions = {
    type: "postgres",
    url: DATABASE_URL,
    synchronize: true,
    logging: false,
    entities: [path.join("src", "entity", "*.ts")],
    migrations: [path.join("src", "migration", "*.ts")],
    subscribers: [path.join("src", "subscriber", "*.ts")],
    cli: {
        entitiesDir: path.join("src", "entity"),
        migrationsDir: path.join("src", "migration"),
        subscribersDir: path.join("src", "subscriber"),
    },
    ssl: true, // For Heroku Postgres: https://github.com/typeorm/typeorm/issues/278
    // https://devcenter.heroku.com/articles/heroku-postgresql#connecting-in-node-js
    extra: {
        ssl: {
            rejectUnauthorized: false, // For Heroku Postgres
        },
    },
};

export default connectionOptions;
