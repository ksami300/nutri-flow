jest.mock("../src/models/User");
jest.mock("../src/services/aiService", () => ({
  getAICoachResponse: jest.fn(),
}));

const User = require("../src/models/User");
const aiService = require("../src/services/aiService");
const { aiCoach } = require("../src/controllers/aiController");

const createResponse = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
});

describe("AI coach access and request validation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("rejects malformed or oversized conversation histories", async () => {
    const res = createResponse();

    await aiCoach(
      { user: { id: "user-1" }, body: { messages: [{ role: "system", content: "x" }] } },
      res,
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(User.findById).not.toHaveBeenCalled();
  });

  it("does not allow free users to use the premium coach", async () => {
    const res = createResponse();
    const user = { _id: "user-1", isPremium: false };
    User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(user) });

    await aiCoach(
      {
        user: { id: "user-1" },
        body: { messages: [{ role: "user", content: "Can you help me plan a workout?" }] },
      },
      res,
    );

    expect(res.status).toHaveBeenCalledWith(403);
    expect(aiService.getAICoachResponse).not.toHaveBeenCalled();
  });

  it("uses the authenticated premium user's quota and returns the coach reply", async () => {
    const res = createResponse();
    const user = { _id: "user-1", isPremium: true };
    User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(user) });
    User.updateOne.mockResolvedValue({ modifiedCount: 0 });
    User.findOneAndUpdate.mockResolvedValue({ _id: "user-1", aiUsageCount: 1 });
    aiService.getAICoachResponse.mockResolvedValue({
      success: true,
      reply: "A gradual, low-impact plan is a good starting point.",
    });

    await aiCoach(
      {
        user: { id: "user-1" },
        body: {
          messages: [
            { role: "assistant", content: "How can I help?" },
            { role: "user", content: "Can you help me plan a workout?" },
          ],
        },
      },
      res,
    );

    const [quotaFilter, quotaUpdate, quotaOptions] =
      User.findOneAndUpdate.mock.calls[0];
    expect(quotaFilter).toEqual(
      expect.objectContaining({
        isPremium: true,
        $or: expect.arrayContaining([
          { aiUsageCount: { $lt: 50 } },
          { aiUsageCount: { $exists: false } },
        ]),
      }),
    );
    expect(quotaUpdate).toEqual(
      expect.objectContaining({ $inc: { aiUsageCount: 1 } }),
    );
    expect(quotaOptions).toEqual({ new: true });
    expect(aiService.getAICoachResponse).toHaveBeenCalledWith([
      { role: "assistant", content: "How can I help?" },
      { role: "user", content: "Can you help me plan a workout?" },
    ]);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: { reply: "A gradual, low-impact plan is a good starting point." },
    });
  });

  it("rejects requests after the daily premium quota is reached", async () => {
    const res = createResponse();
    const user = { _id: "user-1", isPremium: true };
    User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(user) });
    User.updateOne.mockResolvedValue({ modifiedCount: 0 });
    User.findOneAndUpdate.mockResolvedValue(null);

    await aiCoach(
      {
        user: { id: "user-1" },
        body: { messages: [{ role: "user", content: "Another question" }] },
      },
      res,
    );

    expect(res.status).toHaveBeenCalledWith(429);
    expect(aiService.getAICoachResponse).not.toHaveBeenCalled();
  });
});
