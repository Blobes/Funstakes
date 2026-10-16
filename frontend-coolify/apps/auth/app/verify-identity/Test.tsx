"use client";
import { VerifyIdentity } from "@repo/features";
import { mockTransitData } from "@repo/assets";

/**
 * Preview component for testing VerifyIdentity with mock transit data.
 */
export const VerifyIdentityPreview = (props: {
  setShouldRestrict?: (value: boolean) => void;
}) => {
  return (
    <VerifyIdentity
      transitData={mockTransitData("PASSWORD_RESET")}
      onSuccess={() => console.log("Verification succeeded")}
      onRateLimitExceeded={() => console.warn("Rate limit exceeded")}
      isBotChallengeAllowed={() => false}
      setShouldRestrict={props.setShouldRestrict}
    />
  );
};
