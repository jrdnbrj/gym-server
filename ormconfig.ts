import * as path from "path";
import { ConnectionOptions } from "typeorm";
import { DATABASE_URL } from "./src/constants";

const connectionOptions: ConnectionOptions = {
    type: "postgres",
    url: DATABASE_URL,
    synchronize: true,
    logging: true,
    entities: [path.join(__dirname, "src", "entity", "*.ts"),
               path.join(__dirname, "src", "entity", "*.js")],
    migrations: [path.join(__dirname, "src", "migration", "*.ts"),
                 path.join(__dirname, "src", "migration", "*.js")],
    subscribers: [path.join(__dirname, "src", "subscriber", "*.ts"),
                  path.join(__dirname, "src", "subscriber", "*.js")],
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
