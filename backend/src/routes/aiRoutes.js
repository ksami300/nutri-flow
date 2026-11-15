const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const { aiCoach } = require("../controllers/aiController");

const router = express.Router();

router.post("/coach", authMiddleware, aiCoach);

module.exports = router;