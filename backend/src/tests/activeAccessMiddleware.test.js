const requireActiveAccess = require("../middleware/requireActiveAccess");

describe("requireActiveAccess", () => {
  it("continues for a user inside the seven-day trial", () => {
    const req = { user: { createdAt: new Date() } };
    const res = {};
    const next = jest.fn();

    requireActiveAccess(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it("blocks an expired trial with an explicit paywall response", () => {
    const req = { user: { createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000) } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    requireActiveAccess(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(402);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      code: "FREE_ACCESS_EXPIRED",
    }));
  });

  it("continues for Premium users after the trial has elapsed", () => {
    const req = {
      user: {
        createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        isPremium: true,
      },
    };
    const next = jest.fn();

    requireActiveAccess(req, {}, next);

    expect(next).toHaveBeenCalledTimes(1);
  });
});
