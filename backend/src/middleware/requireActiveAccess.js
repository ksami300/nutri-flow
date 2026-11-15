const { getTrialEndsAt, hasActiveAccess } = require("../services/accessService");

module.exports = (req, res, next) => {
  if (hasActiveAccess(req.user)) return next();

  const trialEndsAt = getTrialEndsAt(req.user);
  return res.status(402).json({
    success: false,
    code: "FREE_ACCESS_EXPIRED",
    error: "Vaš besplatan sedmodnevni pristup je istekao. Izaberite Premium da nastavite.",
    trialEndsAt: trialEndsAt?.toISOString() ?? null,
  });
};
