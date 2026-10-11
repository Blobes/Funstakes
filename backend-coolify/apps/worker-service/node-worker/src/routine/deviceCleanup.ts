import cron from "node-cron";
import { DEVICE_NESTED_FIELDS, DeviceModel, UserModel } from "@repo/database";

/**
 * Background maintenance with a grace period for stale primary devices.
 */
export const startDeviceCleanupTask = () => {
  cron.schedule("0 3 * * *", async () => {
    try {
      const PURGE_THRESHOLD = 30; // Days until a non-primary or stale device is deleted
      const GRACE_PERIOD_DAYS = 7; // Extra days allowed for stale primaries before purging

      const thirtyDaysAgo = new Date(
        Date.now() - PURGE_THRESHOLD * 24 * 60 * 60 * 1000,
      );
      const purgeDateWithGrace = new Date(
        thirtyDaysAgo.getTime() - GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000,
      );

      // 1. Purge non-primaries, stale grace-period devices, and unverified devices exceeding threshold
      await DeviceModel.deleteMany({
        $or: [
          // Non-primary devices older than threshold (no user has marked it primary)
          {
            lastSeenAt: { $lt: thirtyDaysAgo },
            [DEVICE_NESTED_FIELDS.USERS_IS_PRIMARY]: { $ne: true },
          },
          // Devices marked as stale that exceeded the grace period
          { isStale: true, lastSeenAt: { $lt: purgeDateWithGrace } },
          // Unverified devices older than threshold across all assigned metadata entries
          {
            createdAt: { $lt: thirtyDaysAgo },
            [DEVICE_NESTED_FIELDS.USERS_IS_VERIFIED]: { $ne: true },
          },
        ],
      });

      // 2. Process primary devices that have just hit the 30-day inactivity mark
      const ghostCursor = DeviceModel.find({
        lastSeenAt: { $lt: thirtyDaysAgo },
        [DEVICE_NESTED_FIELDS.USERS_IS_PRIMARY]: true,
        isStale: { $ne: true }, // Only process those not already in grace period
      })
        .lean()
        .cursor();

      let userUpdates: any[] = [];
      let deviceUpdates: any[] = [];
      let devicesToDelete: any[] = [];

      /**
       * Flushes queued batch operations to database.
       */
      const flushBatches = async () => {
        const tasks = [];
        if (userUpdates.length > 0)
          tasks.push(UserModel.bulkWrite(userUpdates));
        if (deviceUpdates.length > 0)
          tasks.push(DeviceModel.bulkWrite(deviceUpdates));
        if (devicesToDelete.length > 0)
          tasks.push(DeviceModel.deleteMany({ _id: { $in: devicesToDelete } }));

        await Promise.all(tasks);
        userUpdates = [];
        deviceUpdates = [];
        devicesToDelete = [];
      };

      for (
        let ghost = await ghostCursor.next();
        ghost != null;
        ghost = await ghostCursor.next()
      ) {
        // Iterate over users attached to ghost device where they marked it primary
        const primaryUsers = ghost.users.filter((u) => u.isPrimary);

        for (const userMeta of primaryUsers) {
          const userId = userMeta.userId;

          // Try to find a active replacement device for this specific user
          const replacement = await DeviceModel.findOne({
            [DEVICE_NESTED_FIELDS.USERS_USER_ID]: userId,
            _id: { $ne: ghost._id },
            lastSeenAt: { $gte: thirtyDaysAgo },
          })
            .sort({ lastSeenAt: -1 })
            .lean();

          if (replacement) {
            // New primary found for user: update user model
            userUpdates.push({
              updateOne: {
                filter: { _id: userId },
                update: { $set: { primaryDeviceId: replacement._id } },
              },
            });

            // Promote user's meta inside replacement device using $ positional operator
            deviceUpdates.push({
              updateOne: {
                filter: {
                  _id: replacement._id,
                  [DEVICE_NESTED_FIELDS.USERS_USER_ID]: userId,
                },
                update: {
                  $set: {
                    [DEVICE_NESTED_FIELDS.USERS_POSITIONAL_IS_PRIMARY]: true,
                    isStale: false,
                  },
                },
              },
            });

            // Unlink ghost user metadata entry
            deviceUpdates.push({
              updateOne: {
                filter: { _id: ghost._id },
                update: { $pull: { users: { userId } } },
              },
            });
          } else {
            // No active replacement for user: flag device as stale and enter grace period
            deviceUpdates.push({
              updateOne: {
                filter: { _id: ghost._id },
                update: { $set: { isStale: true } },
              },
            });
          }
        }

        // Check if ghost device has no user subdocuments left after updates
        const remainingUsers = ghost.users.length - primaryUsers.length;
        if (remainingUsers <= 0) {
          devicesToDelete.push(ghost._id);
        }

        if (userUpdates.length >= 100 || deviceUpdates.length >= 100) {
          await flushBatches();
        }
      }

      // Flush remaining batch queues
      await flushBatches();
    } catch (error) {
      console.error("[Cron] Grace-Period Cleanup Error:", error);
    }
  });
};
