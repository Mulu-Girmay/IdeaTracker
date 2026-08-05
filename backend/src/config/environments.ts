import Joi from "joi";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({
  path: path.resolve(__dirname, "../../.env"),
});

interface EnvVars {
  PORT: number;
  MONGO_URI: string;
  MONGO_DB_NAME: string;
  JWT_ACCESS_SECRET: string;
  JWT_REFRESH_SECRET: string;
  NODE_ENV: "development" | "production" | "test";
  CORS_ORIGIN: string;
  LOG_LEVEL: "error" | "warn" | "info" | "debug";
  JWT_EXPIRES_IN: string;
  JWT_REFRESH_EXPIRES_IN: string;
  SALT_ROUNDS: number;
  CORS_CREDENTIALS: boolean;
  CLIENT_URL: string;
}

interface Config {
  server: {
    port: number;
    nodeEnv: string;
    isDevelopment: boolean;
    isProduction: boolean;
  };
  database: {
    uri: string;
    dbName: string;
  };
  jwt: {
    secret: string;
    refreshSecret: string;
    expiresIn: string;
    refreshExpiresIn: string;
  };
  auth: {
    saltRounds: number;
  };
  cors: {
    origin: string;
    credentials: boolean;
  };
  client: {
    url: string;
  };
  logging: {
    level: string;
  };
}
const envSchema = Joi.object({
  PORT: Joi.number().default(5000),
  MONGO_URI: Joi.string()
    .uri({ scheme: ["mongodb", "mongodb+srv"] })
    .required(),
  JWT_ACCESS_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  NODE_ENV: Joi.string()
    .valid("development", "production", "test")
    .default("development"),
  CORS_ORIGIN: Joi.string().uri().default("http://localhost:3000"),
  LOG_LEVEL: Joi.string()
    .valid("error", "warn", "info", "debug")
    .default("info"),
  JWT_EXPIRES_IN: Joi.string().required(),
  JWT_REFRESH_EXPIRES_IN: Joi.string().required(),
  SALT_ROUNDS: Joi.number().default(10),
  CORS_CREDENTIALS: Joi.boolean().default(true),
  CLIENT_URL: Joi.string().uri().default("http://localhost:3000"),
});
const { error, value: envVars } = envSchema.validate(process.env, {
  abortEarly: false,
}); //validated returns object with error and value

if (error) {
  console.error("Config validation error: ", error.message);
  error.details.forEach((d) => {
    console.error(`${d.message}`);
  });
  process.exit(1);
}
const validatedEnvVars = envVars as EnvVars;
const config: Config = {
  server: {
    port: validatedEnvVars.PORT,
    nodeEnv: validatedEnvVars.NODE_ENV,
    isDevelopment: validatedEnvVars.NODE_ENV === "development",
    isProduction: validatedEnvVars.NODE_ENV === "production",
  },
  database: {
    uri: validatedEnvVars.MONGO_URI,
    dbName: validatedEnvVars.MONGO_URI.split("/").pop() || "default-db",
  },
  jwt: {
    secret: validatedEnvVars.JWT_ACCESS_SECRET,
    refreshSecret: validatedEnvVars.JWT_REFRESH_SECRET, // ✅ Added missing
    expiresIn: validatedEnvVars.JWT_EXPIRES_IN,
    refreshExpiresIn: validatedEnvVars.JWT_REFRESH_EXPIRES_IN,
  },
  cors: {
    origin: validatedEnvVars.CORS_ORIGIN,
    credentials: validatedEnvVars.CORS_CREDENTIALS,
  },
  auth: {
    saltRounds: validatedEnvVars.SALT_ROUNDS,
  },
  client: {
    url: validatedEnvVars.CLIENT_URL,
  },
  logging: {
    level: validatedEnvVars.LOG_LEVEL,
  },
};
console.log("Environment validated Successfully");
export default config;
