const stripe = require("stripe");
const env = require("../config/envConfig");
const User = require("../models/User");
const logger = require("../utils/logger");

let stripeClient;

function getStripeClient() {
  if (!env.STRIPE_SECRET_KEY) return null;

  if (!stripeClient) {
    stripeClient = stripe(env.STRIPE_SECRET_KEY);
  }

  return stripeClient;
}
const isPaidSubscription = (status) => status === "active" || status === "trialing";

exports.stripeWebhook = async (req, res) => {
  const signature = req.get("stripe-signature");
  if (!Buffer.isBuffer(req.body) || !signature) {
    return res.status(400).json({ success: false, error: "Invalid Stripe webhook request" });
  }

  if (!env.STRIPE_SECRET_KEY || !env.STRIPE_WEBHOOK_SECRET) {
    return res.status(503).json({
      success: false,
      error: "Stripe webhook is not configured",
    });
  }

  const stripeClient = getStripeClient();
  let event;
  try {
    event = stripeClient.webhooks.constructEvent(
      req.body,
      signature,
      env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (error) {
    logger.warn("Stripe webhook signature verification failed:", error.message);
    return res.status(400).json({ success: false, error: "Invalid Stripe signature" });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      let userId = session.client_reference_id || session.metadata?.userId;
      if (!userId && typeof session.customer_email === "string") {
        const user = await User.findOne({
          email: session.customer_email.trim().toLowerCase(),
        }).select("_id");
        userId = user?._id?.toString();
      }
      if (!userId) {
        logger.error("Stripe checkout session is missing its user reference:", session.id);
        return res.status(200).json({ received: true });
      }

      if (session.mode === "subscription" && typeof session.subscription === "string") {
        const subscription = await stripeClient.subscriptions.retrieve(session.subscription);
        const isPaid = session.payment_status === "paid"
          || session.payment_status === "no_payment_required";
        const update = {};
        if (isPaid) update.isPremium = isPaidSubscription(subscription.status);
        if (typeof session.customer === "string") {
          update.stripeCustomerId = session.customer;
        }

        if (Object.keys(update).length > 0) {
          await User.findByIdAndUpdate(userId, { $set: update });
        }
      }
    } else if (
      event.type === "customer.subscription.updated"
      || event.type === "customer.subscription.deleted"
    ) {
      const subscription = event.data.object;
      const customerId = typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer?.id;

      const userId = subscription.metadata?.userId;
      const filter = userId
        ? { _id: userId }
        : customerId
          ? { stripeCustomerId: customerId }
          : null;

      if (filter) {
        await User.findOneAndUpdate(
          filter,
          {
            $set: {
              isPremium: event.type !== "customer.subscription.deleted"
                && isPaidSubscription(subscription.status),
              ...(customerId ? { stripeCustomerId: customerId } : {}),
            },
          },
        );
      }
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    logger.error("Stripe webhook processing failed:", error);
    return res.status(500).json({ success: false, error: "Webhook processing failed" });
  }
};
