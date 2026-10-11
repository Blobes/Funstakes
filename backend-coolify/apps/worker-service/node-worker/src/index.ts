import express from "express";
import { connectDB, initCacheClient, monitorProcess } from "@repo/shared";
import { otpDispatchWorker } from "./processors/otpDispatch";
import appLoader from "./loader";
import { startDeviceCleanupTask } from "./routine/deviceCleanup";
import { FUNSTAKES_REDIS_URL, MONGO_URI, NODE_ENV, PORT } from "./envVars";
import { startUserMetricsReset } from "./routine/resetUserMetrics";
import { startErrorLogCleanupTask } from "./routine/errorLogsCleanup";
import { startSubscriptionTask } from "./routine/subscription";

const startServer = async () => {
  const app = express();

  try {
    monitorProcess();

    await initCacheClient(FUNSTAKES_REDIS_URL); // Initialize Redis cache pool
    await connectDB(MONGO_URI);

    // Background workers
    otpDispatchWorker();
    startDeviceCleanupTask();
    startErrorLogCleanupTask();
    startUserMetricsReset();
    startSubscriptionTask();
    // initUserCleanup()
    // initTopicCleanup();
    // initUserTopicCleanup();

    appLoader(app);

    app.listen(PORT, () => {
      console.log(`🚀 Funstakes Server [${NODE_ENV}] running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
