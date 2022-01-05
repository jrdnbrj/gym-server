import { getMockReq } from "@jest-mock/express";

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
