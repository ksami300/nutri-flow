const app = require("./app");
const connectDB = require("./config/db");
const env = require("./config/envConfig");
const logger = require("./utils/logger");

// 🔥 UVOZ RETENTION ENGINA 2.0 ZA AUTOMATSKO ZADRŽAVANJE KORISNIKA
const { startRetentionEngine, stopRetentionEngine } = require("./services/retentionEngine");
const { initializeExistingTrials } = require("./services/trialMigration");

const HOST = env.NODE_ENV === "production" ? "0.0.0.0" : "127.0.0.1";

const startServer = async () => {
  try {
    await connectDB();
    await initializeExistingTrials();

    const server = app.listen(env.PORT, HOST);
    await new Promise((resolve, reject) => {
      server.once("listening", resolve);
      server.once("error", reject);
    });
    logger.info(`Server listening on port ${env.PORT}`);

    // 🚀 PALJENJE POZADINSKOG RETENTION SATELLITE-A ČIM SERVER KRENE SA RADOM
    startRetentionEngine();

    const shutdown = (signal) => {
      stopRetentionEngine();
      server.close(() => {
        logger.info(`Server ugašen nakon signala ${signal}`);
        process.exit(0);
      });
    };

    process.once("SIGTERM", () => shutdown("SIGTERM"));
    process.once("SIGINT", () => shutdown("SIGINT"));

    return server;
  } catch (error) {
    logger.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();
