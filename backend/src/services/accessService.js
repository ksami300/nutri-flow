const FREE_ACCESS_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

const getTrialEndFrom = (startDate) => {
  const start = new Date(startDate);
  if (!Number.isFinite(start.getTime())) return null;
  return new Date(start.getTime() + FREE_ACCESS_DURATION_MS);
};

const getTrialEndsAt = (userOrCreatedAt) => {
  if (
    userOrCreatedAt
    && typeof userOrCreatedAt === "object"
    && "createdAt" in userOrCreatedAt
  ) {
    const user = userOrCreatedAt;
    if (user.trialEndsAt) {
      const trialEndsAt = new Date(user.trialEndsAt);
      return Number.isFinite(trialEndsAt.getTime()) ? trialEndsAt : null;
    }
    if (user.legacyTrialEligible) return null;
    return getTrialEndFrom(user.createdAt);
  }
  return getTrialEndFrom(userOrCreatedAt);
};

const hasActiveAccess = (user, now = new Date()) => {
  if (user?.isPremium) return true;

  const trialEndsAt = getTrialEndsAt(user);
  return Boolean(trialEndsAt && now < trialEndsAt);
};

module.exports = { getTrialEndFrom, getTrialEndsAt, hasActiveAccess };
