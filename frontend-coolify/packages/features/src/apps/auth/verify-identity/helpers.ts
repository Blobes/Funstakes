import {
  TransitPurpose,
  TransitPayloadMap,
  VerificationTransitData,
  IUser,
  IdentifierType,
} from "@repo/core";
import { extractPayloadKeys, getOtpIdentifierType } from "@repo/helpers";
import { FeedbackInput } from "./useFeedback";

// export type VerificationHandlerFn = (
//   payload: unknown,
//   onSuccessCb?: () => void,
//   accessToken?: string,
// ) => void;

// export type StrategyHandler<P extends TransitPurpose> = (
//   payload: TransitPayloadMap[P] | undefined,
//   onSuccessCb?: () => void,
//   accessToken?: string,
// ) => void;

export type VerificationHandlerFn<TPayload = unknown> = (
  payload: TPayload,
  onSuccessCb?: () => void,
  accessToken?: string,
) => void;

export type StrategyHandler<P extends TransitPurpose> = VerificationHandlerFn<
  TransitPayloadMap[P] | undefined
>;

export type VerificationStrategyMap = {
  [P in TransitPurpose]: StrategyHandler<P>;
};

interface StrategyDependencies {
  handleAuthSuccess: (input: FeedbackInput) => void | Promise<void>;
  handleAccountUpdateSuccess: (input?: FeedbackInput) => void;
  handlePassResetSuccess: (input: FeedbackInput) => void;
  handleMfaActivationSuccess: (input?: FeedbackInput) => void | Promise<void>;
  recipient?: string;
}

/**
 * Creates verification strategy lookup map bound to context dependencies.
 */
export function createVerificationStrategies(
  deps: StrategyDependencies,
): VerificationStrategyMap {
  return {
    LOGIN_VERIFICATION: (payload, onSuccessCb, accessToken) =>
      deps.handleAuthSuccess({
        user: (payload as { user?: IUser })?.user,
        accessToken,
        onSuccessCallback: onSuccessCb,
      }),
    SIGNUP_VERIFICATION: (payload, onSuccessCb) =>
      deps.handleAuthSuccess({
        user: (payload as { user?: IUser })?.user,
        onSuccessCallback: onSuccessCb,
      }),
    PASSWORD_RESET: () =>
      deps.handlePassResetSuccess({ identifier: deps.recipient }),
    ACCOUNT_UPDATE: () => deps.handleAccountUpdateSuccess(),
    IDENTIFIER_UPDATE: () => deps.handleAccountUpdateSuccess(),
    MFA_ACTIVATION: (_, onSuccessCb) =>
      deps.handleMfaActivationSuccess({ onSuccessCallback: onSuccessCb }),
  };
}

/**
 * Executes verification strategy for active transit purpose.
 */
export function executeVerificationStrategy<P extends TransitPurpose>(
  activeTransit: VerificationTransitData<P>,
  strategies: VerificationStrategyMap,
  accessToken?: string,
): void {
  const handler = strategies[activeTransit.purpose] as VerificationHandlerFn;

  if (handler) {
    handler(
      activeTransit.payload,
      activeTransit.onVerificationSuccess,
      accessToken,
    );
  }
}

/**
 * Resolves appropriate recipient for selected communication channels.
 */
export function resolveChannelRecipient<P extends TransitPurpose>(
  activeTransit: VerificationTransitData<P> | undefined,
  identifierType: IdentifierType,
  currentRecipient?: string,
): string | undefined {
  if (!activeTransit) return currentRecipient;

  const fallbackIdentifier = activeTransit.identifier || currentRecipient;

  const payloadUser = extractPayloadKeys(activeTransit.payload, ["user"])
    .user as IUser | undefined;

  const isPhone = identifierType === "PHONE_NUMBER";
  const fallbackType = getOtpIdentifierType(fallbackIdentifier || "");

  if (isPhone) {
    if (payloadUser?.phoneNumber) return payloadUser.phoneNumber;
    if (fallbackIdentifier && fallbackType === "PHONE_NUMBER")
      return fallbackIdentifier;
    return undefined;
  }

  return (
    payloadUser?.email ||
    (fallbackType !== "PHONE_NUMBER" ? fallbackIdentifier : undefined)
  );
}
