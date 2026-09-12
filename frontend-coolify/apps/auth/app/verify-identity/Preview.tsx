"use client";
import { VerifyIdentity } from "@repo/features";
import { mockTransitData } from "@repo/assets";

/**
 * Preview component for testing VerifyIdentity with mock transit data.
 */
export const VerifyIdentityPreview = () => {
  return (
    <VerifyIdentity
      transitData={mockTransitData("MFA_ACTIVATION")}
      // customMethods={["MESSAGING", "TOTP", "SECURITY_QUESTIONS"]}

      onSuccess={() => console.log("Verification succeeded")}
      onRateLimitExceeded={() => console.warn("Rate limit exceeded")}
      isBotChallengeAllowed={() => false}
    />
  );
};
