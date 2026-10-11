import mongoose from "mongoose";
import { ModerationCaseModel, ModerationStrikeModel } from "@repo/database";

const UNRESOLVED_CASE_STATUSES = [
  "OPEN",
  "UNDER_REVIEW",
  "ESCALATED",
  "APPEALED",
] as const;

const MAX_POLICY_BREACH_FOR_PUBLIC_FIGURE = 0;

export async function hasUnresolvedDisputes(
  userId: mongoose.Types.ObjectId,
): Promise<boolean> {
  const found = await ModerationCaseModel.exists({
    targetOwner: userId,
    status: { $in: [...UNRESOLVED_CASE_STATUSES] },
  });
  return Boolean(found);
}

export async function hasActiveStrikes(
  userId: mongoose.Types.ObjectId,
): Promise<boolean> {
  const found = await ModerationStrikeModel.exists({
    account: userId,
    isActive: true,
  });
  return Boolean(found);
}

export function hasPolicyViolation(policyBreachCount?: number | null): boolean {
  return (policyBreachCount ?? 0) > MAX_POLICY_BREACH_FOR_PUBLIC_FIGURE;
}

/** True if user should not receive / keep public-figure recognition paths. */
export async function hasModerationBlock(
  userId: mongoose.Types.ObjectId,
  policyBreachCount?: number | null,
): Promise<boolean> {
  if (hasPolicyViolation(policyBreachCount)) return true;
  if (await hasActiveStrikes(userId)) return true;
  if (await hasUnresolvedDisputes(userId)) return true;
  return false;
}

// // ---------------------------------------------------------------------------
// // Moderation gates
// // ---------------------------------------------------------------------------
// async function isPublicFigureBlockedByModeration(
//   userId: mongoose.Types.ObjectId,
//   policyBreachCount?: number | null,
// ): Promise<boolean> {
//   if ((policyBreachCount ?? 0) > MAX_BREACH) return true;

//   const [strike, dispute] = await Promise.all([
//     ModerationStrikeModel.exists({ account: userId, isActive: true }),
//     ModerationCaseModel.exists({
//       targetOwner: userId,
//       status: { $in: [...UNRESOLVED_CASE_STATUSES] },
//     }),
//   ]);

//   return Boolean(strike || dispute);
// }
