const router = require("express").Router();
const validateRequest = require("../middleware/validateRequest");
const { authLimiter } = require("../middleware/rateLimiter");
const {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} = require("../validation/schemas");

const {
  register,
  login,
  profile,
  forgotPassword,
  resetPassword,
  refreshToken,
  logout,
  accessStatus,
  unsubscribeMarketing,
} = require("../controllers/authController");

const authMiddleware = require("../middleware/authMiddleware");

router.post("/register", authLimiter, validateRequest(registerSchema), register);
router.post("/login", authLimiter, validateRequest(loginSchema), login);
router.post("/refresh-token", refreshToken);
router.post("/logout", logout);
router.get("/profile", authMiddleware, profile);
router.get("/access-status", authMiddleware, accessStatus);
router.post("/unsubscribe", authLimiter, unsubscribeMarketing);
router.post("/forgot-password", authLimiter, validateRequest(forgotPasswordSchema), forgotPassword);
router.post("/reset-password", authLimiter, validateRequest(resetPasswordSchema), resetPassword);

module.exports = router;
