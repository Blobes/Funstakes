import cron from "node-cron";
import { PublicFigureModel, PublicFigureRequestModel } from "@repo/database";

const SIX_MONTHS_MS = 182 * 24 * 60 * 60 * 1000;
let cleanupRunning = false;

/**
 * Cleanup resolved public-figure requests older than 6 months.
 * - DENIED: always eligible for deletion
 * - APPROVED: only if not referenced by PublicFigure.requestId
 * - PENDING: never deleted
 */
export const startPublicFigureRequestCleanupWorker = () => {
  cron.schedule("0 4 * * *", async () => {
    if (cleanupRunning) {
      console.warn(
        "[PublicFigureRequestCleanup] skipped — previous run still active",
      );
      return;
    }

    cleanupRunning = true;
    console.log("[PublicFigureRequestCleanup] starting");

    try {
      const cutoff = new Date(Date.now() - SIX_MONTHS_MS);

      // --- DENIED: remove all past retention ---
      const deniedResult = await PublicFigureRequestModel.deleteMany({
        reviewStatus: "DENIED",
        reviewedAt: { $ne: null, $lte: cutoff },
      });

      // --- APPROVED: only if unreferenced ---
      const approvedCandidates = await PublicFigureRequestModel.find({
        reviewStatus: "APPROVED",
        reviewedAt: { $ne: null, $lte: cutoff },
      })
        .select({ _id: 1 })
        .lean();

      let approvedDeleted = 0;
      let approvedSkipped = 0;

      if (approvedCandidates.length) {
        const candidateIds = approvedCandidates.map((doc) => doc._id);

        const referencedIds = await PublicFigureModel.distinct("requestId", {
          requestId: { $in: candidateIds },
        });

        const referencedSet = new Set(
          referencedIds.filter(Boolean).map((id) => id.toString()),
        );

        const deletableIds = candidateIds.filter(
          (id) => !referencedSet.has(id.toString()),
        );
        approvedSkipped = referencedSet.size;

        if (deletableIds.length) {
          const result = await PublicFigureRequestModel.deleteMany({
            _id: { $in: deletableIds },
          });
          approvedDeleted = result.deletedCount ?? 0;
        }
      }

      console.log(
        `[PublicFigureRequestCleanup] deniedDeleted=${deniedResult.deletedCount} approvedDeleted=${approvedDeleted} approvedSkippedReferenced=${approvedSkipped} cutoff=${cutoff.toISOString()}`,
      );
    } catch (error) {
      console.error("[PublicFigureRequestCleanup] critical", error);
    } finally {
      cleanupRunning = false;
    }
  });
};
