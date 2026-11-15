const mockSelect = jest.fn();
const mockLean = jest.fn();
const mockCursor = jest.fn();

jest.mock("../models/User", () => ({
  find: jest.fn(),
  bulkWrite: jest.fn(),
}));

const User = require("../models/User");
const { initializeExistingTrials } = require("../services/trialMigration");

describe("existing account trial migration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    User.find.mockReturnValue({ select: mockSelect });
    mockSelect.mockReturnValue({ lean: mockLean });
    mockLean.mockReturnValue({ cursor: mockCursor });
    User.bulkWrite.mockResolvedValue({ modifiedCount: 1 });
  });

  it("preserves active trials and grants older free accounts a one-time login grace", async () => {
    mockCursor.mockReturnValue({
      async *[Symbol.asyncIterator]() {
        yield {
          _id: "recent-user",
          createdAt: new Date("2026-01-07T12:00:00.000Z"),
          isPremium: false,
        };
        yield {
          _id: "legacy-user",
          createdAt: new Date("2026-01-01T12:00:00.000Z"),
          isPremium: false,
        };
        yield {
          _id: "premium-user",
          createdAt: new Date("2026-01-01T12:00:00.000Z"),
          isPremium: true,
        };
      },
    });

    await initializeExistingTrials(new Date("2026-01-10T12:00:00.000Z"));

    expect(User.bulkWrite).toHaveBeenCalledWith([
      {
        updateOne: {
          filter: { _id: "recent-user", trialEndsAt: null },
          update: {
            $set: {
              trialEndsAt: new Date("2026-01-14T12:00:00.000Z"),
              legacyTrialEligible: false,
            },
          },
        },
      },
      {
        updateOne: {
          filter: { _id: "legacy-user", trialEndsAt: null },
          update: {
            $set: { trialEndsAt: null, legacyTrialEligible: true },
          },
        },
      },
      {
        updateOne: {
          filter: { _id: "premium-user", trialEndsAt: null },
          update: {
            $set: {
              trialEndsAt: new Date("2026-01-08T12:00:00.000Z"),
              legacyTrialEligible: false,
            },
          },
        },
      },
    ], { ordered: false });
  });
});
