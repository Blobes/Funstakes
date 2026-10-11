import cron from "node-cron";
import mongoose from "mongoose";
import {
  UserModel,
  PublicFigureModel,
  PublicFigureRequestModel,
  IPublicFigureBase,
  IPublicFigureDocument,
} from "@repo/database";
import {
  fetchExternalPublicFigure,
  checkEmailReputation,
  legalNamesMatch,
  getActiveKycWithSelfie,
  normalizeValue,
  hasModerationBlock,
} from "@repo/shared";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const BATCH_SIZE = 50;
const MIN_SCORE = 60;
const EXTERNAL_REFRESH_EVERY_MS = 7 * 24 * 60 * 60 * 1000; // weekly full external
const EMAIL_REP_TTL_MS = 24 * 60 * 60 * 1000;
const EXTERNAL_PACE_MS = 150; // only after external HTTP, not every figure

// In-process locks (prevent overlapping cron runs)
let recencyRunning = false;

const REASONS = {
  REVOCATION_IDENTITY_DRIFT:
    "TEMPORARY: Legal name, account email, or VIP email reputation no longer matches recognition snapshot.",
  REVOCATION_NOTABILITY:
    "TEMPORARY: Recency check failed external notability threshold or missing key signals.",
  ACCOUNT_MISSING: "TEMPORARY: User account missing or not ACTIVE.",
  NO_ACTIVE_KYC: "TEMPORARY: No active approved KYC identity with selfie.",
  MODERATION_BLOCK:
    "TEMPORARY: Unresolved dispute, active strike, or policy violation.",
} as const;

const ACTIONS = {
  REVOKED_ACCOUNT: "REVOKED_ACCOUNT",
  REVOKED_NO_KYC: "REVOKED_NO_KYC",
  REVOKED_DRIFT: "REVOKED_DRIFT",
  REVOKED_MODERATION: "REVOKED_MODERATION",
  INACTIVATED_NOTABILITY: "INACTIVATED_NOTABILITY",
  REFRESHED: "REFRESHED",
  SKIPPED_FRESH: "SKIPPED_FRESH",
} as const;

// ---------------------------------------------------------------------------
// Email reputation cache (process memory, 24h)
// ---------------------------------------------------------------------------
const emailRepCache = new Map<string, { value: boolean; expiresAt: number }>();

async function getCachedEmailReputation(email: string): Promise<boolean> {
  const key = email.toLowerCase().trim();
  const hit = emailRepCache.get(key);
  if (hit && hit.expiresAt > Date.now()) return hit.value;

  const value = await checkEmailReputation(key);
  emailRepCache.set(key, { value, expiresAt: Date.now() + EMAIL_REP_TTL_MS });
  return value;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ---------------------------------------------------------------------------
// Name / KYC helpers
// ---------------------------------------------------------------------------
const namesMeaningfullyDiffer = (
  a?: string | null,
  b?: string | null,
): boolean => {
  if (!a && !b) return false;
  if (!a || !b) return true;
  return !legalNamesMatch(a, b);
};

const revokeFigure = async (
  figureId: mongoose.Types.ObjectId,
  reason: string,
) => {
  await PublicFigureModel.updateOne(
    { _id: figureId },
    {
      $set: {
        status: "REVOKED",
        revokedAt: new Date(),
        revocationReason: reason,
        revokedBy: null,
        revokedByType: "SYSTEM",
      },
    },
  );
};

const inactivateFigure = async (figureId: mongoose.Types.ObjectId) => {
  await PublicFigureModel.updateOne(
    { _id: figureId },
    {
      $set: {
        status: "INACTIVE",
        revokedAt: null,
        revocationReason: null,
      },
    },
  );
};

/** True when a full external notability refresh is due. */
const needsExternalRefresh = (figure: {
  lastExternalRefreshAt?: Date | null;
  updatedAt?: Date;
}) => {
  const anchor = figure.lastExternalRefreshAt ?? figure.updatedAt;
  if (!anchor) return true;
  return Date.now() - new Date(anchor).getTime() >= EXTERNAL_REFRESH_EVERY_MS;
};

const getActiveKycLegalName = async (
  userId: mongoose.Types.ObjectId,
): Promise<string | null> => {
  const identity = await getActiveKycWithSelfie(userId);
  if (!identity) return null;
  const parts = [
    identity.legalFirstName,
    identity.legalMiddleName,
    identity.legalLastName,
  ].filter(Boolean);
  return parts.join(" ").trim() || null;
};

const hasPendingRequest = async (userId: mongoose.Types.ObjectId) =>
  PublicFigureRequestModel.exists({ userId, reviewStatus: "PENDING" });

const createReviewRequest = async (params: {
  userId: mongoose.Types.ObjectId;
  figure: IPublicFigureBase;
  overrides?: Partial<IPublicFigureBase>;
  policyBreachCount?: number | null;
}) => {
  if (await hasPendingRequest(params.userId)) return null;
  if (await hasModerationBlock(params.userId, params.policyBreachCount)) {
    return null;
  }

  return PublicFigureRequestModel.create({
    userId: params.userId,
    publicName: params.overrides?.publicName ?? params.figure.publicName,
    legalName: params.overrides?.legalName ?? params.figure.legalName,
    publicEmail: params.overrides?.publicEmail ?? params.figure.publicEmail,
    accountEmail: params.overrides?.accountEmail ?? params.figure.accountEmail,
    category: params.figure.category,
    notabilityScore:
      params.overrides?.notabilityScore ?? params.figure.notabilityScore ?? 0,
    networth: params.overrides?.networth ?? params.figure.networth ?? null,
    description:
      params.overrides?.description ?? params.figure.description ?? null,
    milestone: params.overrides?.milestone ?? params.figure.milestone ?? null,
    notableWorks:
      params.overrides?.notableWorks ?? params.figure.notableWorks ?? [],
    officialWebsite:
      params.overrides?.officialWebsite ??
      params.figure.officialWebsite ??
      null,
    socialLinks:
      params.overrides?.socialLinks ?? params.figure.socialLinks ?? {},
    signals: params.overrides?.signals ?? params.figure.signals ?? {},
    reviewStatus: "PENDING",
    rejectionReason: null,
    reviewedBy: null,
    reviewedAt: null,
  });
};

// ---------------------------------------------------------------------------
// Public figure recency — single figure
// ---------------------------------------------------------------------------
export const processPublicFigureRecency = async (
  figure: IPublicFigureDocument,
) => {
  const user = await UserModel.findById(figure.userId)
    .select(
      "accountStatus email displayName phoneNumber legalName policyBreachCount publicFigureInfo",
    )
    .lean(false);

  if (!user || user.accountStatus !== "ACTIVE") {
    await revokeFigure(figure._id, REASONS.ACCOUNT_MISSING);
    return { action: ACTIONS.REVOKED_ACCOUNT };
  }

  if (await hasModerationBlock(figure.userId, user.policyBreachCount)) {
    await revokeFigure(figure._id, REASONS.MODERATION_BLOCK);
    if (user.publicFigureInfo) {
      user.publicFigureInfo.isEligible = false;
      await user.save();
    }
    return { action: ACTIONS.REVOKED_MODERATION };
  }

  const kycLegalName = await getActiveKycLegalName(figure.userId);
  if (!kycLegalName) {
    await revokeFigure(figure._id, REASONS.NO_ACTIVE_KYC);
    if (user.publicFigureInfo) {
      user.publicFigureInfo.isEligible = false;
      await user.save();
    }
    return { action: ACTIONS.REVOKED_NO_KYC };
  }

  const accountEmail = normalizeValue(user.email);
  const snapshotAccountEmail = normalizeValue(figure.accountEmail || "");
  const hasVipEmail = accountEmail
    ? await getCachedEmailReputation(accountEmail)
    : false;

  const legalNameDrift = namesMeaningfullyDiffer(
    kycLegalName,
    figure.legalName ?? null,
  );
  const accountEmailDrift =
    !accountEmail ||
    !snapshotAccountEmail ||
    accountEmail !== snapshotAccountEmail;
  const vipLost = !hasVipEmail;

  // Path A — identity / VIP drift (no external notability bundle)
  if (legalNameDrift || accountEmailDrift || vipLost) {
    await revokeFigure(figure._id, REASONS.REVOCATION_IDENTITY_DRIFT);
    await createReviewRequest({
      userId: figure.userId,
      figure,
      policyBreachCount: user.policyBreachCount,
      overrides: {
        legalName: kycLegalName,
        publicEmail: figure.publicEmail,
        accountEmail,
        notabilityScore: figure.notabilityScore,
        signals: { ...figure.signals, hasVipEmail },
      },
    });
    if (user.publicFigureInfo) {
      user.publicFigureInfo.isEligible = false;
      user.publicFigureInfo.signals = {
        ...user.publicFigureInfo.signals,
        hasVipEmail,
      };
      await user.save();
    }
    return { action: ACTIONS.REVOKED_DRIFT };
  }

  // Path B — skip heavy external if refreshed within the week
  if (!needsExternalRefresh(figure as any)) {
    return { action: ACTIONS.SKIPPED_FRESH };
  }

  const external = await fetchExternalPublicFigure({
    displayName: user.displayName,
    legalName: kycLegalName,
    email: accountEmail,
    phoneNumber: user.phoneNumber,
  });
  await sleep(EXTERNAL_PACE_MS); // pace only after external

  const score = external.data?.notabilityScore ?? 0;
  const tangible =
    external.status === "SUCCESS" &&
    Boolean(external.data) &&
    score >= MIN_SCORE &&
    Boolean(external.data?.publicName);

  if (!tangible) {
    await inactivateFigure(figure._id);
    await createReviewRequest({
      userId: figure.userId,
      figure,
      policyBreachCount: user.policyBreachCount,
      overrides: {
        legalName: kycLegalName,
        accountEmail,
        publicEmail: external.data?.publicEmail ?? figure.publicEmail,
        notabilityScore: score,
        publicName: external.data?.publicName ?? figure.publicName,
        description: external.data?.description,
        signals: external.data?.signals ?? { hasVipEmail },
        networth: external.data?.networth,
        notableWorks: external.data?.notableWorks,
        officialWebsite: external.data?.officialWebsite,
        socialLinks: external.data?.socialLinks,
      },
    });
    if (user.publicFigureInfo) {
      user.publicFigureInfo.isEligible = true;
      await user.save();
    }
    return { action: ACTIONS.INACTIVATED_NOTABILITY };
  }

  const fetched = external.data!;

  await PublicFigureModel.updateOne(
    { _id: figure._id },
    {
      $set: {
        status: "ACTIVE",
        publicName: fetched.publicName ?? figure.publicName,
        legalName: kycLegalName,
        publicEmail: fetched.publicEmail ?? figure.publicEmail,
        accountEmail,
        notabilityScore: score,
        description: fetched.description ?? null,
        networth: fetched.networth ?? null,
        milestone: fetched.milestone ?? null,
        notableWorks: fetched.notableWorks ?? [],
        officialWebsite: fetched.officialWebsite ?? null,
        socialLinks: fetched.socialLinks ?? {},
        signals: { ...fetched.signals, hasVipEmail: true },
        lastExternalRefreshAt: new Date(),
        revokedAt: null,
        revocationReason: null,
      },
    },
  );

  if (kycLegalName && namesMeaningfullyDiffer(user.legalName, kycLegalName)) {
    user.legalName = kycLegalName;
  }

  user.publicFigureInfo = {
    publicFigureId: figure._id,
    isEligible: true,
    signals: {
      hasWikipedia: Boolean(fetched.signals?.hasWikipedia),
      hasVipEmail: true,
      hasVipPhone: Boolean(fetched.signals?.hasVipPhone),
    },
  };
  await user.save();

  return { action: ACTIONS.REFRESHED };
};

// ---------------------------------------------------------------------------
// Public figure recency cron
// ---------------------------------------------------------------------------
export const startPublicFigureRecencyWorker = () => {
  cron.schedule("0 3 * * *", async () => {
    if (recencyRunning) {
      console.warn("[PublicFigureRecency] skipped — previous run still active");
      return;
    }
    recencyRunning = true;
    console.log("[PublicFigureRecency] starting");

    let refreshed = 0;
    let revoked = 0;
    let inactivated = 0;
    let skipped = 0;
    let lastId: mongoose.Types.ObjectId | null = null;

    try {
      for (;;) {
        const query: Record<string, unknown> = { status: "ACTIVE" };
        if (lastId) query._id = { $gt: lastId };

        const batch = await PublicFigureModel.find(query)
          .sort({ _id: 1 })
          .limit(BATCH_SIZE)
          .lean();

        if (!batch.length) break;

        for (const figure of batch) {
          try {
            const result = await processPublicFigureRecency(
              figure as IPublicFigureDocument,
            );
            if (result.action === ACTIONS.REFRESHED) refreshed++;
            else if (result.action === ACTIONS.SKIPPED_FRESH) skipped++;
            else if (result.action === ACTIONS.INACTIVATED_NOTABILITY)
              inactivated++;
            else if (String(result.action).startsWith("REVOKED")) revoked++;
          } catch (err) {
            console.error(
              `[PublicFigureRecency] figure ${figure._id} failed`,
              err,
            );
          }
        }

        lastId = batch[batch.length - 1]._id as mongoose.Types.ObjectId;
      }

      console.log(
        `[PublicFigureRecency] done refreshed=${refreshed} skipped=${skipped} revoked=${revoked} inactivated=${inactivated}`,
      );
    } catch (error) {
      console.error("[PublicFigureRecency] critical", error);
    } finally {
      recencyRunning = false;
    }
  });
};
