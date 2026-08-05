import { Types } from "mongoose";
import { IUser } from "../models/user/types.js";

declare global {
  namespace Express {
    interface User extends IUser {}

    interface Request {
      userId?: Types.ObjectId | string;
      resource?: any;
    }
  }
}
