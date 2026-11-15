const express = require("express");
const router = express.Router();
const stripe = require("stripe");
const env = require("../config/envConfig");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");

let stripeClient;

function getStripeClient() {
  if (!env.STRIPE_SECRET_KEY) return null;

  if (!stripeClient) {
    stripeClient = stripe(env.STRIPE_SECRET_KEY);
  }

  return stripeClient;
}
const frontendUrl = env.FRONTEND_URL.split(",")[0].trim().replace(/\/+$/, "");

router.post("/checkout", authMiddleware, async (req, res) => {
  try {
    if (!env.STRIPE_SECRET_KEY || !env.STRIPE_PRICE_ID) {
      return res.status(503).json({
        success: false,
        error: "Stripe billing is not configured",
      });
    }

    const stripeClient = getStripeClient();
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, error: "User not found" });

    const checkoutOptions = {
      mode: "subscription",
      line_items: [{
        price: env.STRIPE_PRICE_ID,
        quantity: 1,
      }],
      client_reference_id: req.user.id,
      metadata: { userId: req.user.id },
      subscription_data: { metadata: { userId: req.user.id } },
      success_url: `${frontendUrl}/dashboard/billing?success=true`,
      cancel_url: `${frontendUrl}/dashboard/billing?canceled=true`,
    };
    if (user.stripeCustomerId) {
      checkoutOptions.customer = user.stripeCustomerId;
    } else {
      checkoutOptions.customer_email = req.user.email;
    }

    const session = await stripeClient.checkout.sessions.create(checkoutOptions);

    return res.json({ success: true, url: session.url });
  } catch (error) {
    return res.status(500).json({ success: false, error: "Unable to create checkout session" });
  }
});

router.get("/status", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, error: "User not found" });
    return res.json({ success: true, data: { isPremium: user.isPremium } });
  } catch (error) {
    return res.status(500).json({ success: false, error: "Unable to retrieve subscription status" });
  }
});

module.exports = router;
