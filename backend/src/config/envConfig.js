const dotenv = require("dotenv");
const Joi = require("joi");

dotenv.config({ path: process.env.NUTRIFLOW_ENV_FILE || ".env" });

const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid("development", "production", "test").default("development"),
  PORT: Joi.number().integer().min(1).max(65535).default(5000),
  MONGO_URI: Joi.string().required(),
  JWT_SECRET: Joi.string().min(32).required(),
  OPENAI_API_KEY: Joi.string().required(),
  FRONTEND_URL: Joi.string().required(),
  STRIPE_SECRET_KEY: Joi.string().allow("").optional(),
  STRIPE_PRICE_ID: Joi.string().allow("").optional(),
  STRIPE_WEBHOOK_SECRET: Joi.string().allow("").optional(),
  EMAIL_USER: Joi.string().email().required(),
  EMAIL_PASS: Joi.string().required(),
}).unknown();

const { error, value: env } = envSchema.validate(process.env, {
  abortEarly: false,
  allowUnknown: true,
});

if (error) {
  console.error("ENV validation error:", error.details.map((detail) => detail.message).join(", "));
  process.exit(1);
}

module.exports = env;
