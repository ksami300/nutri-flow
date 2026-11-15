const express = require("express");
const router = express.Router();
const billingController = require("../controllers/billingController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/portal-session", authMiddleware, billingController.createBillingPortalSession);

module.exports = router;
