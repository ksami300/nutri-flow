const cron = require("node-cron");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const User = require("../models/User");
const env = require("../config/envConfig");
const logger = require("../utils/logger");

const DAY_MS = 24 * 60 * 60 * 1000;
const frontendUrl = env.FRONTEND_URL.split(",")[0].trim().replace(/\/+$/, "");
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

let retentionTask;
let isRunning = false;

const sendTrialReminder = async (user, now = new Date()) => {
  const unsubscribeToken = jwt.sign(
    { sub: user._id.toString(), purpose: "marketing-unsubscribe" },
    env.JWT_SECRET,
    { expiresIn: "365d" },
  );
  const unsubscribeUrl = `${frontendUrl}/unsubscribe?token=${encodeURIComponent(unsubscribeToken)}`;
  const dashboardUrl = `${frontendUrl}/dashboard/billing`;

  await transporter.sendMail({
    from: `"NutriFlow" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: "Vaš NutriFlow probni period se uskoro završava",
    text: [
      `Zdravo ${user.name},`,
      "",
      "Vaš sedmodnevni besplatni pristup uskoro se završava.",
      "NutriFlow Premium uključuje personalizovane planove ishrane, sačuvanu istoriju planova i AI Coach.",
      "Ako želite da nastavite, trenutnu cenu i uslove pretplate možete pregledati na sigurnoj Stripe stranici:",
      dashboardUrl,
      "",
      "Ova poruka je poslata jer ste izričito pristali na NutriFlow novosti.",
      `Odjava sa promotivnih poruka: ${unsubscribeUrl}`,
    ].join("\n"),
  });

  await User.updateOne(
    {
      _id: user._id,
      isPremium: false,
      marketingConsent: true,
      retentionLastSentAt: null,
    },
    { $set: { retentionLastSentAt: now } },
  );
};

const processTrialReminders = async (now = new Date()) => {
  const reminderDeadline = new Date(now.getTime() + 2 * DAY_MS);
  const users = User.find({
    isPremium: false,
    marketingConsent: true,
    trialEndsAt: { $gt: now, $lte: reminderDeadline },
    retentionLastSentAt: null,
  }).select("_id name email").lean().cursor();

  let processed = 0;
  for await (const user of users) {
    try {
      await sendTrialReminder(user, now);
      processed += 1;
    } catch (error) {
      logger.error("Trial reminder email failed:", error);
    }
  }
  return processed;
};

const startRetentionEngine = () => {
  if (retentionTask) return retentionTask;

  retentionTask = cron.schedule("0 20 * * *", async () => {
    if (isRunning) return;
    isRunning = true;
    try {
      const processed = await processTrialReminders();
      logger.info(`Trial reminder emails sent: ${processed}`);
    } catch (error) {
      logger.error("Trial reminder engine failed:", error);
    } finally {
      isRunning = false;
    }
  });
  logger.info("Trial reminder engine scheduled.");
  return retentionTask;
};

const stopRetentionEngine = () => {
  if (retentionTask) {
    retentionTask.stop();
    retentionTask = undefined;
  }
};

module.exports = {
  processTrialReminders,
  sendTrialReminder,
  startRetentionEngine,
  stopRetentionEngine,
};
