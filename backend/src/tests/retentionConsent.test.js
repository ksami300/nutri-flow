const mockSendMail = jest.fn();
const mockSelect = jest.fn();
const mockLean = jest.fn();
const mockCursor = jest.fn();

jest.mock("../models/User", () => ({
  find: jest.fn(),
  updateOne: jest.fn(),
}));
jest.mock("nodemailer", () => ({
  createTransport: jest.fn(() => ({ sendMail: (...args) => mockSendMail(...args) })),
}));

const User = require("../models/User");
const { processTrialReminders } = require("../services/retentionEngine");

describe("trial reminder consent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    User.find.mockReturnValue({ select: mockSelect });
    mockSelect.mockReturnValue({ lean: mockLean });
    mockLean.mockReturnValue({ cursor: mockCursor });
  });

  it("only selects opted-in free users during the trial reminder window", async () => {
    mockCursor.mockReturnValue({
      async *[Symbol.asyncIterator]() {},
    });

    await processTrialReminders(new Date("2026-01-07T12:00:00.000Z"));

    expect(User.find).toHaveBeenCalledWith(expect.objectContaining({
      isPremium: false,
      marketingConsent: true,
      retentionLastSentAt: null,
      trialEndsAt: expect.objectContaining({ $gt: expect.any(Date), $lte: expect.any(Date) }),
    }));
    expect(mockSendMail).not.toHaveBeenCalled();
  });

  it("includes a functioning opt-out link in an opted-in reminder", async () => {
    mockCursor.mockReturnValue({
      async *[Symbol.asyncIterator]() {
        yield {
          _id: { toString: () => "user-123" },
          name: "Test User",
          email: "user@example.com",
          trialEndsAt: new Date("2026-01-08T12:00:00.000Z"),
        };
      },
    });
    mockSendMail.mockResolvedValue({});
    User.updateOne.mockResolvedValue({ modifiedCount: 1 });

    const sent = await processTrialReminders(new Date("2026-01-07T12:00:00.000Z"));

    expect(sent).toBe(1);
    expect(mockSendMail).toHaveBeenCalledWith(expect.objectContaining({
      to: "user@example.com",
      text: expect.stringContaining("/unsubscribe?token="),
    }));
    expect(User.updateOne).toHaveBeenCalledWith(
      expect.objectContaining({ marketingConsent: true, retentionLastSentAt: null }),
      expect.objectContaining({ $set: { retentionLastSentAt: expect.any(Date) } }),
    );
  });
});
