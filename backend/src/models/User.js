const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      unique: true,
      required: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      select: false,
    },

    referralCode: {
      type: String,
      trim: true,
    },

    isPremium: {
      type: Boolean,
      default: false,
    },

    trialEndsAt: {
      type: Date,
      default: null,
    },

    legacyTrialEligible: {
      type: Boolean,
      default: false,
    },

    retentionLastSentAt: {
      type: Date,
      default: null,
    },

    marketingConsent: {
      type: Boolean,
      default: false,
    },

    marketingConsentAt: {
      type: Date,
      default: null,
    },

    marketingUnsubscribedAt: {
      type: Date,
      default: null,
    },

    refreshToken: {
      type: String,
      select: false,
    },

    passwordResetToken: {
      type: String,
      select: false,
    },

    passwordResetExpires: Date,

    stripeCustomerId: {
      type: String,
      unique: true,
      sparse: true,
    },

    aiUsageCount: {
      type: Number,
      default: 0,
    },
    aiUsageDate: {
      type: Date,
      default: () => new Date(),
    },

    preferences: {
      dietType: {
        type: String,
        enum: ["standard", "keto", "vegan", "high-protein"],
        default: "standard",
      },
      excludedFoods: {
        type: [String],
        default: [],
      },
      likedMeals: {
        type: [String],
        default: [],
      },
      dislikedMeals: {
        type: [String],
        default: [],
      },
    },
  },
  { timestamps: true }
);

userSchema.index({
  isPremium: 1,
  marketingConsent: 1,
  createdAt: 1,
  retentionLastSentAt: 1,
});
userSchema.index({ trialEndsAt: 1, marketingConsent: 1, retentionLastSentAt: 1 });

module.exports = mongoose.model("User", userSchema);
