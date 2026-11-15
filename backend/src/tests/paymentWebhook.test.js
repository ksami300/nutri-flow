const mockConstructEvent = jest.fn();

jest.mock("../models/User");
jest.mock("stripe", () => jest.fn(() => ({
  webhooks: { constructEvent: (...args) => mockConstructEvent(...args) },
  subscriptions: { retrieve: jest.fn().mockResolvedValue({ status: "active" }) },
})));

const User = require("../models/User");
const { stripeWebhook } = require("../controllers/paymentController");

describe("Stripe webhook", () => {
  let req;
  let res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      body: Buffer.from("{}"),
      get: jest.fn().mockReturnValue("stripe-signature"),
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  it("rejects an invalid signature without changing account access", async () => {
    mockConstructEvent.mockImplementation(() => {
      throw new Error("invalid signature");
    });

    await stripeWebhook(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
    expect(User.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it("activates Premium only from a signed, paid checkout for the referenced user", async () => {
    mockConstructEvent.mockReturnValue({
      type: "checkout.session.completed",
      data: {
        object: {
          client_reference_id: "user-123",
          metadata: { userId: "user-123" },
          customer: "cus-123",
          subscription: "sub-123",
          mode: "subscription",
          payment_status: "paid",
        },
      },
    });

    await stripeWebhook(req, res);

    expect(User.findByIdAndUpdate).toHaveBeenCalledWith("user-123", {
      $set: { isPremium: true, stripeCustomerId: "cus-123" },
    });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("does not grant Premium for an unpaid checkout", async () => {
    mockConstructEvent.mockReturnValue({
      type: "checkout.session.completed",
      data: {
        object: {
          client_reference_id: "user-123",
          mode: "subscription",
          payment_status: "unpaid",
        },
      },
    });

    await stripeWebhook(req, res);

    expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("synchronizes Premium access when the subscription is canceled", async () => {
    mockConstructEvent.mockReturnValue({
      type: "customer.subscription.deleted",
      data: { object: { customer: "cus-123", status: "canceled" } },
    });

    await stripeWebhook(req, res);

    expect(User.findOneAndUpdate).toHaveBeenCalledWith(
      { stripeCustomerId: "cus-123" },
      { $set: { isPremium: false, stripeCustomerId: "cus-123" } },
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
