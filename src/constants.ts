export const __prod__ = process.env.NODE_ENV === "production";
export const __debug__ = !__prod__;

if (__debug__) {
    require("dotenv").config();
}

export const MONGO_URL = process.env.MONGO_URL;
