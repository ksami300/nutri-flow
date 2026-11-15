const aiService = require("../services/aiService");
const User = require("../models/User");
const logger = require("../utils/logger");

const MAX_DAILY_AI_REQUESTS = 50;
const MAX_COACH_MESSAGES = 20;
const MAX_MESSAGE_LENGTH = 2000;

exports.aiCoach = async (req, res) => {
  const submittedMessages = req.body?.messages;
  if (
    !Array.isArray(submittedMessages) ||
    submittedMessages.length === 0 ||
    submittedMessages.length > MAX_COACH_MESSAGES
  ) {
    return res.status(400).json({
      success: false,
      error: `Messages must contain between 1 and ${MAX_COACH_MESSAGES} entries`,
    });
  }

  const messages = [];
  for (const message of submittedMessages) {
    if (
      !message ||
      !["user", "assistant"].includes(message.role) ||
      typeof message.content !== "string" ||
      !message.content.trim() ||
      message.content.length > MAX_MESSAGE_LENGTH
    ) {
      return res.status(400).json({
        success: false,
        error: "Each message must have a valid role and non-empty content under 2000 characters",
      });
    }

    messages.push({ role: message.role, content: message.content.trim() });
  }

  if (messages[messages.length - 1].role !== "user") {
    return res.status(400).json({
      success: false,
      error: "The latest message must come from the user",
    });
  }

  try {
    const user = await User.findById(req.user.id).select(
      "isPremium aiUsageCount aiUsageDate",
    );
    if (!user) {
      return res.status(401).json({ success: false, error: "User not found" });
    }

    if (!user.isPremium) {
      return res.status(403).json({
        success: false,
        error: "The AI coach is available with NutriFlow Premium",
      });
    }

    const now = new Date();
    const startOfToday = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );

    await User.updateOne(
      {
        _id: user._id,
        $or: [
          { aiUsageDate: { $lt: startOfToday } },
          { aiUsageDate: null },
          { aiUsageDate: { $exists: false } },
        ],
      },
      { $set: { aiUsageDate: now, aiUsageCount: 0 } },
    );

    const reservedUsage = await User.findOneAndUpdate(
      {
        _id: user._id,
        isPremium: true,
        $or: [
          { aiUsageCount: { $lt: MAX_DAILY_AI_REQUESTS } },
          { aiUsageCount: { $exists: false } },
        ],
      },
      { $inc: { aiUsageCount: 1 }, $set: { aiUsageDate: now } },
      { new: true },
    );
    if (!reservedUsage) {
      return res.status(429).json({
        success: false,
        error: "The daily AI coach limit has been reached",
      });
    }

    let result;
    try {
      result = await aiService.getAICoachResponse(messages);
    } catch (aiError) {
      await User.updateOne(
        {
          _id: user._id,
          aiUsageDate: now,
          aiUsageCount: reservedUsage.aiUsageCount,
        },
        { $inc: { aiUsageCount: -1 } },
      );
      throw aiError;
    }

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.message || "AI service temporarily unavailable",
      });
    }

    return res.json({
      success: true,
      data: {
        reply: result.reply,
      },
    });
  } catch (err) {
    logger.error("AI Coach error:", err);
    return res.status(500).json({
      success: false,
      error: "AI service temporarily unavailable",
    });
  }
};