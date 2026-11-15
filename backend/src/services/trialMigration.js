const User = require("../models/User");
const { getTrialEndFrom } = require("./accessService");
const logger = require("../utils/logger");

const FREE_ACCESS_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
const BATCH_SIZE = 500;

const initializeExistingTrials = async (now = new Date()) => {
  const legacyCutoff = new Date(now.getTime() - FREE_ACCESS_DURATION_MS);
  const users = User.find({
    trialEndsAt: null,
    legacyTrialEligible: { $ne: true },
  }).select("_id createdAt isPremium").lean().cursor();

  let operations = [];
  let migrated = 0;
  for await (const user of users) {
    const trialEndsAt = getTrialEndFrom(user.createdAt);
    const isLegacyFreeUser = !user.isPremium
      && (!trialEndsAt || trialEndsAt <= now || user.createdAt <= legacyCutoff);

    operations.push({
      updateOne: {
        filter: { _id: user._id, trialEndsAt: null },
        update: {
          $set: {
            trialEndsAt: isLegacyFreeUser ? null : trialEndsAt,
            legacyTrialEligible: isLegacyFreeUser,
          },
        },
      },
    });

    if (operations.length >= BATCH_SIZE) {
      const result = await User.bulkWrite(operations, { ordered: false });
      migrated += result.modifiedCount;
      operations = [];
    }
  }

  if (operations.length) {
    const result = await User.bulkWrite(operations, { ordered: false });
    migrated += result.modifiedCount;
  }

  logger.info(`Initialized trial access for ${migrated} existing users.`);
  return migrated;
};

module.exports = { initializeExistingTrials };
