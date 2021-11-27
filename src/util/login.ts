import { Request } from "express";
import { User } from "../entity/User";

const login = (req: Request, user: User) => {
    req.session.userId = user.id;
    req.session.save();
};

export default login;
