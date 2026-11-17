const Joi = require("joi");

const passwordRule = Joi.string()
  .min(8)
  .max(128)
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
  .required()
  .messages({
    "string.min": "Password must be at least 8 characters long",
    "string.pattern.base": "Password must include at least one uppercase letter, one lowercase letter, and one number",
  });

const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(80).required(),
  email: Joi.string().trim().email().required(),
  password: passwordRule,
  marketingConsent: Joi.boolean().optional(),
});

const loginSchema = Joi.object({
  email: Joi.string().trim().email().required(),
  password: Joi.string().required(),
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().trim().email().required(),
});

const resetPasswordSchema = Joi.object({
  token: Joi.string().trim().required(),
  password: passwordRule,
});

const mealPlanSchema = Joi.object({
  weight: Joi.number().min(30).max(300).required(),
  height: Joi.number().min(100).max(250).required(),
  age: Joi.number().min(14).max(100).required(),
  gender: Joi.string().valid("male", "female").required(),
  activityLevel: Joi.string()
    .valid("sedentary", "light", "moderate", "active", "veryActive", "very_active", "athlete")
    .optional(),
  goal: Joi.string().valid("lose", "gain", "maintain").required(),
  trainingDays: Joi.number().integer().min(0).max(7).optional(),
  preferences: Joi.object({
    dietType: Joi.string().valid("standard", "keto", "vegan", "high-protein").optional(),
    excludedFoods: Joi.array().items(Joi.string().trim().min(1).max(60)).max(25).optional(),
    healthConditions: Joi.array().items(Joi.string().valid("diabetes", "hypertension", "cholesterol")).max(5).optional(),
    customNote: Joi.string().trim().allow("").max(300).optional(),
    market: Joi.string().valid("SR", "US").optional(),
  }).optional(),
});

module.exports = {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  mealPlanSchema,
};
