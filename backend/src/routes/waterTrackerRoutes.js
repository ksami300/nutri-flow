const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const WaterLog = require("../models/WaterLog");

const router = express.Router();
router.use(authMiddleware);

router.post("/", async (req, res, next) => {
  try {
    const amountMl = Number(req.body.amountMl);
    if (!Number.isFinite(amountMl) || amountMl <= 0 || amountMl > 5000) {
      return res.status(400).json({ success: false, message: "Unesite ispravnu količinu vode (1-5000 ml)." });
    }
    const log = await WaterLog.create({ user: req.user._id, amountMl });
    return res.status(201).json({
      success: true,
      data: {
        id: log._id.toString(),
        amountMl: log.amountMl,
        createdAt: log.createdAt.toISOString(),
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get("/daily", async (req, res, next) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const logs = await WaterLog.find({
      user: req.user._id,
      createdAt: { $gte: startOfDay },
    }).sort({ createdAt: 1 });

    const data = logs.map((log) => ({
      id: log._id.toString(),
      amountMl: log.amountMl,
      createdAt: log.createdAt.toISOString(),
    }));

    return res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
