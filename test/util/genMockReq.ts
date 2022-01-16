import { getMockReq } from "@jest-mock/express";
import { genDbUser } from "./genDbUser";

export const genMockReq = () => {
    return getMockReq({
        session: {
            save: jest.fn(),
            destroy: jest.fn((f: Function) => {
                f(undefined);
            }),
        },
    });
};

export const genMockReqAsAdmin = async () => {
    const admin = await genDbUser({ isAdmin: true });

    const req = genMockReq();
    req.session.userId = admin.id;

    return req;
};
