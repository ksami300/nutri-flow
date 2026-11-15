const MealPlan = require("../models/MealPlan");

exports.getPublicMealPlan = async (req, res) => {
  try {
    const planId = req.params.id;

    if (typeof planId !== "string" || !/^[a-f\d]{24}$/i.test(planId)) {
      return res.status(404).json({
        success: false,
        message: "Javni plan nije pronađen ili je uklonjen.",
      });
    }

    const plan = await MealPlan.findOne({
      _id: planId,
      isPublic: true,
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Javni plan nije pronađen ili je uklonjen.",
      });
    }

    const publicData = {
      _id: plan._id,
      goal: plan.goal,
      calories: plan.calories,
      macros: plan.macros,
      weeklyPlan: plan.weeklyPlan,
      createdAt: plan.createdAt,
      source: plan.source,
      isAIGenerated: plan.isAIGenerated,
    };

    return res.status(200).json({
      success: true,
      message: "Javni plan je uspešno učitan.",
      data: publicData,
    });
  } catch (err) {
    console.error("Public meal plan retrieval failed:", err);

    return res.status(500).json({
      success: false,
      message: "Došlo je do greške prilikom učitavanja javnog plana.",
    });
  }
};