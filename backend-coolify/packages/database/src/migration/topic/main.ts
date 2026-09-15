import { runRemove, runSync } from "./syncTopics";

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
