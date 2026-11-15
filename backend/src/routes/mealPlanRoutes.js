const router = require("express").Router();
const authMiddleware = require("../middleware/authMiddleware");
const requireActiveAccess = require("../middleware/requireActiveAccess");
const validateRequest = require("../middleware/validateRequest");
const { mealPlanSchema } = require("../validation/schemas");
const {
  createMealPlan,
  deleteMealPlan,
  getGroceryList,
  getMealPlans,
  shareMealPlan,
} = require("../controllers/mealPlanController");

router.use(authMiddleware, requireActiveAccess);

router
  .route("/")
  .get(getMealPlans)
  .post(validateRequest(mealPlanSchema), createMealPlan);
router.get("/:id/grocery-list", getGroceryList);
router.post("/:id/share", shareMealPlan);
router.delete("/:id", deleteMealPlan);

module.exports = router;
