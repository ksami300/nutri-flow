const { getTrialEndsAt, hasActiveAccess } = require("../src/services/accessService");

describe("seven-day free access", () => {
  const createdAt = new Date("2026-01-01T12:00:00.000Z");
  const trialEndsAt = new Date("2026-01-08T12:00:00.000Z");

  it("expires exactly seven days after account creation", () => {
    expect(getTrialEndsAt(createdAt)).toEqual(trialEndsAt);
    expect(hasActiveAccess({ createdAt }, new Date(trialEndsAt.getTime() - 1))).toBe(true);
    expect(hasActiveAccess({ createdAt }, trialEndsAt)).toBe(false);
  });

  it("keeps premium accounts active after the free period", () => {
    expect(
      hasActiveAccess(
        { createdAt, isPremium: true },
        new Date("2026-02-01T12:00:00.000Z"),
      ),
    ).toBe(true);
  });

  it("uses a persisted trial end date and does not start legacy grace before login", () => {
    expect(
      hasActiveAccess(
        { createdAt, trialEndsAt, legacyTrialEligible: false },
        new Date("2026-01-07T12:00:00.000Z"),
      ),
    ).toBe(true);
    expect(
      hasActiveAccess(
        { createdAt, legacyTrialEligible: true },
        new Date("2026-01-07T12:00:00.000Z"),
      ),
    ).toBe(false);
  });

  it("denies access when a valid account creation date is unavailable", () => {
    expect(getTrialEndsAt(undefined)).toBeNull();
    expect(hasActiveAccess({ createdAt: undefined })).toBe(false);
  });
});
