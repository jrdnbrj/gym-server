import {ConnectionOptions} from "typeorm";
import {DATABASE_URL} from "./src/constants";

const connectionOptions: ConnectionOptions = {
    type: "postgres",
    url: DATABASE_URL,
    synchronize: true,
    logging: false,
    entities: [
        "src/entity/**/*.ts"
    ],
    migrations: [
        "src/migration/**/*.ts"
    ],
    subscribers: [
        "src/subscriber/**/*.ts"
    ],
    cli: {
        "entitiesDir": "src/entity",
        "migrationsDir": "src/migration",
        "subscribersDir": "src/subscriber"
    },
    ssl: true, // For Heroku Postgres: https://github.com/typeorm/typeorm/issues/278
    // https://devcenter.heroku.com/articles/heroku-postgresql#connecting-in-node-js
    extra: {
        ssl: {
            rejectUnauthorized: false, // For Heroku Postgres
        }
    }
}

export default connectionOptions;
