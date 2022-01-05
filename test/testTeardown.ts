import { getConnection } from "typeorm";

// TODO: not used?
/** Close test setup.*/
const testTeardown = async () => {
    await getConnection().close();
    console.log("Test db connecton closed!");
};

export default testTeardown;
