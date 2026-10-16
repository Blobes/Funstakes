import { withDatabaseConnection } from "@repo/database";
import { seedOrganizations } from "./seed";

export const runOrgSeed = async (): Promise<void> => {
  await withDatabaseConnection(async () => {
    await seedOrganizations({ limit: 500 });
  });
};

const isMain = typeof require !== "undefined" && require.main === module;

if (isMain) {
  runOrgSeed().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
