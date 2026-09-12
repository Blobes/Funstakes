import mongoose, { ClientSession, Types } from "mongoose";
import { SEED_TOPICS } from "../constants/topics";
import { TopicModel } from "../models/non-entities/topic";

export interface IRemoveTopicOptions {
  currentTitle?: string;
  topicId?: string;
  replaceWith?: string;
  session?: ClientSession;
}

/**
 * Syncs initial topic seeds into MongoDB without resetting aggregated counters.
 */
export const syncTopics = async (): Promise<void> => {
  try {
    const operations = SEED_TOPICS.map((title) => ({
      updateOne: {
        filter: { title },
        update: {
          $setOnInsert: {
            title,
            userCount: 0,
            postCount: 0,
          },
        },
        upsert: true,
      },
    }));

    const result = await TopicModel.bulkWrite(operations);
    console.log(
      `Topics sync completed. Inserted: ${result.upsertedCount}, Matched existing: ${result.matchedCount}`,
    );
  } catch (error) {
    console.error("Failed to sync topics to database:", error);
    throw error;
  }
};

/**
 * Removes or deprecates a topic based on usage metrics.
 *
 * @param title Target topic title to remove (optional if options.topicId is supplied).
 * @param options Configuration options including topicId, target replacement title, and Mongoose session.
 */
export const removeTopic = async (
  options: IRemoveTopicOptions,
): Promise<void> => {
  const { currentTitle, topicId, replaceWith, session } = options;

  const cleanTitle = currentTitle ? currentTitle.trim().toLowerCase() : null;
  const cleanReplaceWith = replaceWith
    ? replaceWith.trim().toLowerCase()
    : null;

  if (!topicId && !cleanTitle) {
    throw new Error(
      "Must provide either a topicId or a topic title to execute removal.",
    );
  }

  try {
    let topic = null;

    if (topicId) {
      if (!Types.ObjectId.isValid(topicId)) {
        throw new Error(
          `Invalid ObjectId format provided for topicId: "${topicId}"`,
        );
      }
      topic = await TopicModel.findById(topicId).session(session || null);
    }

    if (!topic && cleanTitle) {
      topic = await TopicModel.findOne({ title: cleanTitle }).session(
        session || null,
      );
    }

    if (!topic) {
      const identifier = topicId
        ? `ID "${topicId}"`
        : `title "${currentTitle}"`;
      console.warn(`Topic with ${identifier} was not found.`);
      return;
    }

    const hasActiveUsage = topic.userCount > 0 || topic.postCount > 0;

    if (!hasActiveUsage) {
      await TopicModel.deleteOne({ _id: topic._id }).session(session || null);
      console.log(
        `Topic "${topic.title}" had zero usage and was removed successfully.`,
      );
      return;
    }

    if (!cleanReplaceWith) {
      throw new Error(
        `Cannot rename active topic "${topic.title}" (userCount: ${topic.userCount}, postCount: ${topic.postCount}) without a valid replaceWith value.`,
      );
    }

    await TopicModel.updateOne(
      { _id: topic._id },
      {
        $set: {
          title: cleanReplaceWith,
          oldTitle: topic.title,
          updatedAt: new Date(),
        },
      },
      { session },
    );

    console.log(
      `Active topic "${topic.title}" updated to "${cleanReplaceWith}". Old title saved in oldTitle.`,
    );
  } catch (error) {
    console.error(`Failed to remove or update topic:`, error);
    throw error;
  }
};

/**
 * Helper utility to manage Mongoose lifecycle wrapper around execution scripts.
 *
 * @param action Execution block containing database actions to run.
 */
const withDatabaseConnection = async (
  action: () => Promise<void>,
): Promise<void> => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    console.error("Error: MONGODB_URI environment variable is missing.");
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB...");

  try {
    await action();
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
};

/**
 * Executes direct connection and sync process for command-line runner execution.
 */
export const runSync = async (): Promise<void> => {
  await withDatabaseConnection(async () => {
    await syncTopics();
  });
};

/**
 * Executes target topic removal pipeline using explicit arguments for CLI input execution.
 *
 * @param title Target topic title to remove.
 * @param replaceWith Optional replacement title if target contains active usage metrics.
 * @param topicId Optional topic database ObjectId string for primary lookup.
 */
export const runRemove = async (
  currentTitle?: string,
  replaceWith?: string,
  topicId?: string,
): Promise<void> => {
  await withDatabaseConnection(async () => {
    await removeTopic({ currentTitle, replaceWith, topicId });
  });
};

/**
 * Command line entry point executor.
 */
const main = async (): Promise<void> => {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === "--remove") {
    let targetTitle: string | undefined;
    let replacementTitle: string | undefined;
    let targetTopicId: string | undefined;

    if (args[1] === "--topicId") {
      targetTopicId = args[2];
      replacementTitle = args[3];
    } else {
      targetTitle = args[1];
      replacementTitle = args[2];
    }

    if (!targetTopicId && !targetTitle) {
      console.error(
        "Error: Missing target topic identifier. Usage: --remove <title> [replaceWith] OR --remove --id <topicId> [replaceWith]",
      );
      process.exit(1);
    }

    await runRemove(targetTitle, replacementTitle, targetTopicId);
  } else {
    await runSync();
  }
};

if (require.main === module) {
  main().catch(() => process.exit(1));
}
