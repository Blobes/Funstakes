import mongoose from "mongoose";
import {
  OrganizationModel,
  OrganizationSource,
  OrganizationStatus,
  SubscriptionModel,
  SubscriptionTier,
} from "@repo/database";
import {
  TransInfo,
  MESSAGES_REGISTRY,
  fetchSingleUser,
  hasModerationBlock,
  getActiveKycWithSelfie,
  extractDomain,
  toNameCanonical,
} from "@repo/shared";

const MIN_ACCOUNT_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const PREMIUM_TIERS = new Set<SubscriptionTier>(["PREMIUM", "ENTERPRISE"]);

export interface ICreateOrganizationInput {
  actor: OrganizationSource;
  userId?: string;
  name: string;
  primaryDomain: string;
  website?: string | null;
  country?: string | null;
  alternateDomains?: string[];
  logoUrl?: string | null;
  status?: OrganizationStatus;
  allowDomainJoin?: boolean;
  /** ADMIN may attach claim to a user */
  claimedByUserId?: string | null;
}

export type CreateOrganizationStatus =
  | "SUCCESS"
  | "INVALID_PAYLOAD"
  | "USER_NOT_FOUND"
  | "ACCOUNT_INACTIVE"
  | "EMAIL_NOT_VERIFIED"
  | "KYC_REQUIRED"
  | "ACCOUNT_TOO_NEW"
  | "SUBSCRIPTION_REQUIRED"
  | "MODERATION_BLOCKED"
  | "DOMAIN_BLOCKED"
  | "DOMAIN_TAKEN"
  | "ALREADY_CLAIMED_PENDING"
  | "FORBIDDEN";

export interface ICreateOrganizationResult {
  status: CreateOrganizationStatus;
  transInfo: TransInfo;
  payload?: {
    organizationId?: mongoose.Types.ObjectId;
    status?: string;
    primaryDomain?: string;
    name?: string;
    requiresKyc?: boolean;
  };
}

/**
 * Active Premium or Enterprise subscription for the user.
 */
const hasActivePremiumSubscription = async (
  userId: mongoose.Types.ObjectId,
): Promise<boolean> => {
  const sub = await SubscriptionModel.findOne({
    userId,
    status: { $in: ["ACTIVE", "TRIALING"] },
    tier: { $in: [...PREMIUM_TIERS] },
  })
    .select("_id tier status")
    .lean();
  return Boolean(sub);
};

/**
 * User already has an org pending review that they claimed.
 */
const hasPendingOwnedOrg = async (
  userId: mongoose.Types.ObjectId,
): Promise<boolean> => {
  const existing = await OrganizationModel.findOne({
    claimedByUserId: userId,
    status: "PENDING_REVIEW",
  })
    .select("_id")
    .lean();
  return Boolean(existing);
};

/**
 * Domain already used as primary or alternate on another org.
 */
const findDomainConflict = async (
  primaryDomain: string,
  alternateDomains: string[],
) => {
  const domains = [primaryDomain, ...alternateDomains];
  return OrganizationModel.findOne({
    $or: [
      { primaryDomain: { $in: domains } },
      { alternateDomains: { $in: domains } },
    ],
  })
    .select("_id primaryDomain name status")
    .lean();
};

/**
 * USER eligibility: KYC identity, 7d age, Premium+, no moderation block.
 */
const assertUserEligible = async (
  userId: string,
): Promise<ICreateOrganizationResult | null> => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return {
      status: "INVALID_PAYLOAD",
      transInfo: MESSAGES_REGISTRY.PROFILE.INVALID_ID_FORMAT,
    };
  }

  const userObjectId = new mongoose.Types.ObjectId(userId);
  const user = await fetchSingleUser({
    identifier: userId,
    flags: { lean: false, skipFilter: false },
  });

  if (!user) {
    return {
      status: "USER_NOT_FOUND",
      transInfo: MESSAGES_REGISTRY.AUTH.USER_NOT_FOUND,
    };
  }

  if (user.accountStatus !== "ACTIVE") {
    return {
      status: "ACCOUNT_INACTIVE",
      transInfo: MESSAGES_REGISTRY.VERIFICATION.ACCOUNT_NOT_ACTIVE,
    };
  }

  if (!user.isEmailVerified) {
    return {
      status: "EMAIL_NOT_VERIFIED",
      transInfo: MESSAGES_REGISTRY.PROFILE.EMAIL_NOT_VERIFIED,
    };
  }

  if (await hasModerationBlock(userObjectId, user.policyBreachCount)) {
    return {
      status: "MODERATION_BLOCKED",
      transInfo: MESSAGES_REGISTRY.PROFILE.PUBLIC_FIGURE_MODERATION_BLOCKED,
      // or ORG_MODERATION_BLOCKED when you add a dedicated message
    };
  }

  const identity = await getActiveKycWithSelfie(userObjectId);
  if (!identity) {
    return {
      status: "KYC_REQUIRED",
      transInfo: MESSAGES_REGISTRY.VERIFICATION.KYC_TIER_1_REQUIRED,
      payload: { requiresKyc: true },
    };
  }

  const createdAt = user.createdAt ? new Date(user.createdAt).getTime() : 0;
  if (!createdAt || Date.now() - createdAt < MIN_ACCOUNT_AGE_MS) {
    return {
      status: "ACCOUNT_TOO_NEW",
      transInfo: MESSAGES_REGISTRY.ORGANIZATION.ACCOUNT_TOO_NEW,
    };
  }

  if (!(await hasActivePremiumSubscription(userObjectId))) {
    return {
      status: "SUBSCRIPTION_REQUIRED",
      transInfo: MESSAGES_REGISTRY.ORGANIZATION.PREMIUM_REQUIRED,
    };
  }

  if (await hasPendingOwnedOrg(userObjectId)) {
    return {
      status: "ALREADY_CLAIMED_PENDING",
      transInfo: MESSAGES_REGISTRY.ORGANIZATION.ALREADY_PENDING,
    };
  }

  return null;
};

/**
 * Creates an organization for USER (pending review) or ADMIN (optional ACTIVE).
 */
export const executeCreateOrganization = async (
  input: ICreateOrganizationInput,
): Promise<ICreateOrganizationResult> => {
  const {
    actor,
    userId,
    name: rawName,
    primaryDomain: rawDomain,
    website,
    country,
    alternateDomains = [],
    logoUrl,
    status: statusOverride,
    allowDomainJoin = true,
    claimedByUserId,
  } = input;

  const name = rawName?.trim();
  if (!name || name.length < 2) {
    return {
      status: "INVALID_PAYLOAD",
      transInfo: MESSAGES_REGISTRY.VERIFICATION.INVALID_PAYLOAD,
    };
  }

  const primaryDomain = extractDomain(rawDomain || website);
  if (!primaryDomain) {
    return {
      status: "DOMAIN_BLOCKED",
      transInfo: MESSAGES_REGISTRY.ORGANIZATION.DOMAIN_INVALID,
    };
  }
  const alternates = [
    ...new Set(
      alternateDomains
        .map((d) => extractDomain(d))
        .filter((d): d is string => Boolean(d) && d !== primaryDomain),
    ),
  ];

  // ---------- Actor-specific gates ----------
  let claimUserId: mongoose.Types.ObjectId | null = null;

  if (actor === "USER") {
    if (!userId) {
      return {
        status: "INVALID_PAYLOAD",
        transInfo: MESSAGES_REGISTRY.VERIFICATION.INVALID_PAYLOAD,
      };
    }
    const eligibilityError = await assertUserEligible(userId);
    if (eligibilityError) return eligibilityError;
    claimUserId = new mongoose.Types.ObjectId(userId);
  } else if (actor === "ADMIN") {
    if (claimedByUserId) {
      if (!mongoose.Types.ObjectId.isValid(claimedByUserId)) {
        return {
          status: "INVALID_PAYLOAD",
          transInfo: MESSAGES_REGISTRY.PROFILE.INVALID_ID_FORMAT,
        };
      }
      claimUserId = new mongoose.Types.ObjectId(claimedByUserId);
    }
  } else {
    return {
      status: "FORBIDDEN",
      transInfo: MESSAGES_REGISTRY.AUTH.FORBIDDEN,
    };
  }

  const conflict = await findDomainConflict(primaryDomain, alternates);
  if (conflict) {
    return {
      status: "DOMAIN_TAKEN",
      transInfo: MESSAGES_REGISTRY.ORGANIZATION.DOMAIN_TAKEN,
      payload: {
        organizationId: conflict._id as mongoose.Types.ObjectId,
        primaryDomain: conflict.primaryDomain,
        name: conflict.name,
        status: conflict.status,
      },
    };
  }

  const isUser = actor === "USER";
  const status = isUser ? "PENDING_REVIEW" : (statusOverride ?? "ACTIVE");

  const source: OrganizationSource = isUser ? "USER" : "ADMIN";
  const verificationMethod = isUser ? null : "ADMIN_VERIFIED";
  const verifiedAt = isUser ? null : new Date();

  try {
    const doc = await OrganizationModel.create({
      name,
      nameCanonical: toNameCanonical(name),
      primaryDomain,
      alternateDomains: alternates,
      website: website?.trim() || `https://${primaryDomain}`,
      country: country?.trim() || null,
      logoUrl: logoUrl?.trim() || null,
      status,
      source,
      addedByType: actor,
      claimedByUserId: claimUserId,
      claimedAt: claimUserId ? new Date() : null,
      verification: {
        method: verificationMethod,
        verifiedAt,
      },
      allowDomainJoin,
    });

    return {
      status: "SUCCESS",
      transInfo: isUser
        ? MESSAGES_REGISTRY.ORGANIZATION.SUBMITTED_FOR_REVIEW
        : MESSAGES_REGISTRY.ORGANIZATION.CREATED,
      payload: {
        organizationId: doc._id as mongoose.Types.ObjectId,
        status: doc.status,
        primaryDomain: doc.primaryDomain,
        name: doc.name,
      },
    };
  } catch (err: any) {
    // Unique index race on primaryDomain
    if (err?.code === 11000) {
      return {
        status: "DOMAIN_TAKEN",
        transInfo: MESSAGES_REGISTRY.ORGANIZATION.DOMAIN_TAKEN,
      };
    }
    throw err;
  }
};
