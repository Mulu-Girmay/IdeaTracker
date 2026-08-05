import mongoose from "mongoose";
import { logger } from "./winston.js";

interface DatabaseConfig {
  uri: string;
  dbName: string;
}

const connectDB = async (uri: DatabaseConfig) => {
  try {
    await mongoose.connect(uri.uri);
    logger.info("MongoDB connected successfully");
  } catch (error) {
    logger.error("Mongodb connection error: ", error);
  }
};

export default connectDB;
