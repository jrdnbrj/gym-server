import { createConnection } from "typeorm";

export const testDb = async (drop: boolean = false) => {
    return await createConnection({
        type: "postgres",
        host: "test-db",
        username: "postgres",
        password: "postgres",
        database: "postgres",
        dropSchema: drop,
        synchronize: drop,
        migrationsRun: true,
        logging: false,
        entities: ["src/entity/**/*.ts"],
        migrations: ["src/migration/**/*.ts"],
        subscribers: ["src/subscriber/**/*.ts"],
        cli: {
            entitiesDir: "src/entity",
            migrationsDir: "src/migration",
            subscribersDir: "src/subscriber",
        },
    });
};
