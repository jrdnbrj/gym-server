import { Connection, getConnection } from "typeorm";
import { testDb } from "../../../test/testDb";
import { genDbUser } from "../../../test/util/genDbUser";
import { genMockReq } from "../../../test/util/genMockReq";
import { User } from "../../entity/User";
import { adminUserRolesMutation } from "./mutation/adminUserRolesMutation";
import { gCallExpectFullPrivilegeUser } from "./util/gCallExpect";

beforeAll(async () => {
    await testDb(false);
});

afterAll(async () => {
    await getConnection().close();
});

describe("adminUserRoles mutation", () => {
    it("should make a no-privilege user a full-privilege one", async () => {
        const admin = await genDbUser({ isAdmin: true });

        const req = genMockReq();
        req.session.userId = admin.id;

        const user = await genDbUser();

        await gCallExpectFullPrivilegeUser(
            adminUserRolesMutation,
            "adminUserRoles",
            user,
            {
                variableValues: {
                    userID: user.id,
                    isClient: true,
                    isInstructor: true,
                    isAdmin: true,
                },
                context: { req },
            }
        );

        // Test db
        const foundUser = await User.findOne(user.id);
        expect(foundUser).toBeDefined();

        expect(await foundUser!.client).toBeDefined();
        expect(await foundUser!.instructor).toBeDefined();
        expect(await foundUser!.admin).toBeDefined();
    });
});
