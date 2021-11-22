import {ConnectionOptions} from "typeorm";
import {MONGO_URL} from "./src/constants";

const connectionOptions: ConnectionOptions = {
    type: "mongodb",
    url: MONGO_URL,
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
    useUnifiedTopology: true,
}

export default connectionOptions;
