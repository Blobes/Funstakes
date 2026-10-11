import cron from "node-cron";
import mongoose from "mongoose";
import { IKycBaseRequest, KycRequestModel } from "@repo/database";
import { legalNamesMatch } from "@repo/shared";

const SIX_MONTHS_MS = 182 * 24 * 60 * 60 * 1000;
const BATCH_SIZE = 50;
const PURGEABLE_STATUSES = ["REJECTED", "CANCELED"] as const;

let cleanupRunning = false;

const composeLegalName = (doc?: IKycBaseRequest | null): string => {
  if (!doc) return "";
  return [doc.legalFirstName, doc.legalMiddleName, doc.legalLastName]
    .filter(Boolean)
    .join(" ")
    .trim();
};

/** Prefer reviewedAt, then submittedAt, then createdAt. */
const subdocAgeDate = (doc: IKycBaseRequest): Date | null => {
  const raw = doc.reviewedAt || doc.submittedAt;
  return raw ? new Date(raw) : null;
};

const isOlderThanRetention = (doc: IKycBaseRequest, cutoff: Date): boolean => {
  const d = subdocAgeDate(doc);
  return Boolean(d && d.getTime() <= cutoff.getTime());
};

/**
 * Eligible for purge:
 * - not active AND (REJECTED | CANCELED | or inactive non-approved), past retention
 * Identity: only if legal name matches the active identity (keep name-change history).
 */
const shouldPurgeSubdoc = (
  doc: IKycBaseRequest,
  cutoff: Date,
  options?: { activeIdentityLegalName?: string | null; isIdentity?: boolean },
): boolean => {
  if (doc.isActive) return false;

  const status = doc.reviewStatus ?? "";
  const isRejectedOrCanceled = PURGEABLE_STATUSES.includes(
    status as (typeof PURGEABLE_STATUSES)[number],
  );
  // Inactive leftovers that are not the live approved row
  const isInactiveStale =
    !doc.isActive &&
    status !== "APPROVED" &&
    status !== "PENDING" &&
    status !== "UNDER_REVIEW";

  if (!isRejectedOrCanceled && !isInactiveStale) {
    // Still allow purge of inactive APPROVED duplicates past retention
    if (!(status === "APPROVED" && !doc.isActive)) return false;
  }

  if (!isOlderThanRetention(doc, cutoff)) return false;

  if (options?.isIdentity) {
    const activeName = options.activeIdentityLegalName ?? "";
    const thisName = composeLegalName(doc);
    // Keep history when names differ from the active identity
    if (!activeName || !thisName) return false;
    if (!legalNamesMatch(activeName, thisName)) return false;
  }

  return true;
};

const filterTierArray = (
  list: IKycBaseRequest[] | undefined,
  cutoff: Date,
  options?: { activeIdentityLegalName?: string | null; isIdentity?: boolean },
): { next: IKycBaseRequest[]; removed: number } => {
  if (!list?.length) return { next: list ?? [], removed: 0 };

  const next: IKycBaseRequest[] = [];
  let removed = 0;

  for (const doc of list) {
    if (shouldPurgeSubdoc(doc, cutoff, options)) {
      removed++;
    } else {
      next.push(doc);
    }
  }

  return { next, removed };
};

/**
 * Daily: strip old inactive/rejected KYC subdocuments; preserve identity name-change history.
 */
export const startKycCleanupWorker = () => {
  cron.schedule("0 5 * * *", async () => {
    if (cleanupRunning) {
      console.warn("[KycCleanup] skipped — previous run still active");
      return;
    }

    cleanupRunning = true;
    console.log("[KycCleanup] starting");

    const cutoff = new Date(Date.now() - SIX_MONTHS_MS);
    let lastId: mongoose.Types.ObjectId | null = null;
    let docsTouched = 0;
    let subdocsRemoved = 0;

    try {
      for (;;) {
        const query: Record<string, unknown> = {};
        if (lastId) query._id = { $gt: lastId };

        const batch = await KycRequestModel.find(query)
          .sort({ _id: 1 })
          .limit(BATCH_SIZE);

        if (!batch.length) break;

        for (const kyc of batch) {
          const tiers = kyc.requestTiers;
          if (!tiers) continue;

          const activeIdentity = tiers.identity?.find(
            (item) => item.isActive && item.reviewStatus === "APPROVED",
          );
          const activeIdentityLegalName = composeLegalName(activeIdentity);

          const identity = filterTierArray(
            tiers.identity as IKycBaseRequest[],
            cutoff,
            {
              isIdentity: true,
              activeIdentityLegalName,
            },
          );
          const address = filterTierArray(
            tiers.address as IKycBaseRequest[],
            cutoff,
          );
          const business = filterTierArray(
            tiers.business as IKycBaseRequest[],
            cutoff,
          );
          const finance = filterTierArray(
            tiers.finance as IKycBaseRequest[],
            cutoff,
          );

          const removedHere =
            identity.removed +
            address.removed +
            business.removed +
            finance.removed;

          if (removedHere === 0) continue;

          // Mutate the narrowed object (same reference as kyc.requestTiers)
          tiers.identity = identity.next as typeof tiers.identity;
          tiers.address = address.next as typeof tiers.address;
          tiers.business = business.next as typeof tiers.business;
          tiers.finance = finance.next as typeof tiers.finance;

          kyc.markModified("requestTiers");
          await kyc.save();

          docsTouched++;
          subdocsRemoved += removedHere;
        }

        lastId = batch[batch.length - 1]._id as mongoose.Types.ObjectId;
      }

      console.log(
        `[KycCleanup] docsTouched=${docsTouched} subdocsRemoved=${subdocsRemoved} cutoff=${cutoff.toISOString()}`,
      );
    } catch (error) {
      console.error("[KycCleanup] critical", error);
    } finally {
      cleanupRunning = false;
    }
  });
};
