import { GistModel } from "../models/entities/gist";
import { UserModel } from "../models/entities/user";
import {
  MigrationRunner,
  Migration,
  AutoSyncSchemaFields,
} from "./migrationRunner";

const MONGODB_URI = process.env.MONGO_URI || "";

/**
 * Initializes and executes schema synchronization migrations.
 */
async function executeMigrations(): Promise<void> {
  const migrations: Migration[] = [
    // Auto-sync user collection with renaming and field archiving
    new AutoSyncSchemaFields(
      UserModel,
      {
        sampleSize: 2000,
        excludeFieldsFromUnset: [],
        archiveBeforeUnset: true,
      },
      "Sync_UserModel_v1",
    ),

    // Auto-sync Gist model fields
    new AutoSyncSchemaFields(
      GistModel,
      {
        sampleSize: 1000,
        excludeFieldsFromUnset: [],
      },
      "Sync_GistModel_v1",
    ),
  ];
  const runner = new MigrationRunner(MONGODB_URI, migrations);
  await runner.run();
}

executeMigrations();
