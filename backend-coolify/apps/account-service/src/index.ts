import express from "express";
import {
  connectDB,
  initCacheClient,
  initQueueClient,
  monitorProcess,
} from "@repo/shared";
import appLoader from "./loader";
import { FUNSTAKES_REDIS_URL, MONGO_URI, NODE_ENV, PORT } from "./envVars";

const startServer = async () => {
  const app = express();

  await initCacheClient(FUNSTAKES_REDIS_URL); // Initialize Redis cache pool
  initQueueClient(FUNSTAKES_REDIS_URL); // Initialize Queue engine pool

  try {
    monitorProcess();
    await connectDB(MONGO_URI);

    // Sync authorization with database
    //  await syncDBAuthorization();

    appLoader(app);

    app.listen(PORT, () => {
      console.log(
        `🚀 Funstakes Account Service [${NODE_ENV}] running on port ${PORT}`,
      );
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
