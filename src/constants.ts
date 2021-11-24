export const __prod__ = process.env.NODE_ENV === "production";
export const __debug__ = !__prod__;

if (__debug__) {
    require("dotenv").config();
}

export const DATABASE_URL = process.env.DATABASE_URL;
export const SESSION_SECRET = process.env.SESSION_SECRET || "";
