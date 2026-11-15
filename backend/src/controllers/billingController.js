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

exports.createBillingPortalSession = async (req, res) => {
  try {
    if (!env.STRIPE_SECRET_KEY) {
      return res.status(503).json({
        success: false,
        message: "Stripe billing is not configured.",
      });
    }

    const stripeClient = getStripeClient();
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Korisnik nije pronađen u sistemu.",
      });
    }

    if (!user.stripeCustomerId) {
      return res.status(400).json({
        success: false,
        message: "Nema platne istorije. Prvo aktivirajte Premium preko Stripe Checkout-a.",
      });
    }

    const session = await stripeClient.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${env.FRONTEND_URL.split(",")[0].trim().replace(/\/+$/, "")}/dashboard/billing`,
    });

    return res.status(200).json({
      success: true,
      url: session.url,
      message: "Stripe Billing Portal session created.",
    });
  } catch (error) {
    logger.error("Billing portal session creation failed:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to create billing portal session.",
    });
  }
};