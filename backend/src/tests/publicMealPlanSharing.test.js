jest.mock("../models/MealPlan", () => ({
  findOne: jest.fn(),
}));

jest.mock("../models/User", () => ({
  findById: jest.fn(),
}));

jest.mock("../services/mealPlanService", () => ({
  generateMealPlan: jest.fn(),
  generateWeeklyPlan: jest.fn(),
  generateGroceryList: jest.fn(),
}));

jest.mock("../services/aiService", () => ({
  generateAIPlan: jest.fn(),
}));

jest.mock("../services/workoutEngine", () => ({
  generatePremiumWorkout: jest.fn(),
}));

jest.mock("../services/motivationEngine", () => ({
  getRandomPremiumMotivation: jest.fn(),
}));

const MealPlan = require("../models/MealPlan");
const { shareMealPlan } = require("../controllers/mealPlanController");
const { getPublicMealPlan } = require("../controllers/publicMealPlanController");

describe("NUTRIFLOW PUBLIC MEAL PLAN SHARING", () => {
  let req;
  let res;
  let originalFrontendUrl;

  const validId = "507f1f77bcf86cd799439011";

  beforeEach(() => {
    jest.clearAllMocks();

    originalFrontendUrl = process.env.FRONTEND_URL;
    process.env.FRONTEND_URL = "https://frontend.example.test/";

    req = {
      params: { id: validId },
      user: { id: "mock-user-123" },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  afterEach(() => {
    if (originalFrontendUrl === undefined) {
      delete process.env.FRONTEND_URL;
    } else {
      process.env.FRONTEND_URL = originalFrontendUrl;
    }
  });

  describe("shareMealPlan", () => {
    it("shares an existing plan owned by the authenticated user", async () => {
      const plan = {
        _id: validId,
        isPublic: false,
        save: jest.fn().mockResolvedValue(true),
      };

      MealPlan.findOne.mockResolvedValue(plan);

      await shareMealPlan(req, res);

      expect(MealPlan.findOne).toHaveBeenCalledWith({
        _id: validId,
        user: "mock-user-123",
      });

      expect(plan.isPublic).toBe(true);
      expect(plan.save).toHaveBeenCalledTimes(1);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          publicUrl: `https://frontend.example.test/share/${validId}`,
        })
      );
    });

    it("rejects an invalid plan ID", async () => {
      req.params.id = "invalid-id";

      await shareMealPlan(req, res);

      expect(MealPlan.findOne).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("does not share a plan that does not belong to the user", async () => {
      MealPlan.findOne.mockResolvedValue(null);

      await shareMealPlan(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("rejects sharing when FRONTEND_URL is invalid", async () => {
      const plan = {
        _id: validId,
        isPublic: false,
        save: jest.fn(),
      };

      MealPlan.findOne.mockResolvedValue(plan);
      process.env.FRONTEND_URL = "not-a-valid-url";

      await shareMealPlan(req, res);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(plan.save).not.toHaveBeenCalled();
      expect(plan.isPublic).toBe(false);
    });
  });

  describe("getPublicMealPlan", () => {
    it("returns only an explicitly public meal plan", async () => {
      const plan = {
        _id: validId,
        goal: "lose",
        calories: 2200,
        macros: { protein: 150, carbs: 220, fats: 70 },
        weeklyPlan: [{ day: "Monday", meals: [] }],
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        source: "generated",
        isAIGenerated: false,
        user: "private-user-id",
        cacheKey: "private-cache-key",
      };

      MealPlan.findOne.mockResolvedValue(plan);

      await getPublicMealPlan(req, res);

      expect(MealPlan.findOne).toHaveBeenCalledWith({
        _id: validId,
        isPublic: true,
      });

      expect(res.status).toHaveBeenCalledWith(200);

      const response = res.json.mock.calls[0][0];

      expect(response.success).toBe(true);
      expect(response.data).toEqual({
        _id: plan._id,
        goal: plan.goal,
        calories: plan.calories,
        macros: plan.macros,
        weeklyPlan: plan.weeklyPlan,
        createdAt: plan.createdAt,
        source: plan.source,
        isAIGenerated: plan.isAIGenerated,
      });

      expect(response.data.user).toBeUndefined();
      expect(response.data.cacheKey).toBeUndefined();
    });

    it("does not return a private or nonexistent plan", async () => {
      MealPlan.findOne.mockResolvedValue(null);

      await getPublicMealPlan(req, res);

      expect(MealPlan.findOne).toHaveBeenCalledWith({
        _id: validId,
        isPublic: true,
      });

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("rejects an invalid plan ID without querying the database", async () => {
      req.params.id = "invalid-id";

      await getPublicMealPlan(req, res);

      expect(MealPlan.findOne).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});