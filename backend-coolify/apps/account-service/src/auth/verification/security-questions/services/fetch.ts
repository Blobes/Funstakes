import { SecurityQuestionModel } from "@repo/database";
import {
  detectIdentifierType,
  fetchSingleUser,
  MESSAGES_REGISTRY,
  TransInfo,
} from "@repo/shared";

export interface IFetchInput {
  identifier: string;
}

export interface IFetchResult {
  status:
    | "SUCCESS"
    | "MISSING_INPUT"
    | "INVALID_IDENTIFIER"
    | "NOT_FOUND"
    | "RESTRICTION";
  transInfo: TransInfo;
  payload: {
    questions: string[];
  } | null;
}

/**
 * Fetches configured security questions for a specific user identifier.
 */
export const executeFetchSecurityQuestions = async (
  input: IFetchInput,
): Promise<IFetchResult> => {
  const { identifier } = input;

  if (!identifier) {
    return {
      status: "MISSING_INPUT",
      transInfo: MESSAGES_REGISTRY.AUTH.MISSING_REQUIRED_FIELDS,
      payload: null,
    };
  }

  const isEmail = detectIdentifierType(identifier) === "EMAIL";
  const isPhone = detectIdentifierType(identifier) === "PHONE_NUMBER";

  if (!isEmail && !isPhone) {
    return {
      status: "INVALID_IDENTIFIER",
      transInfo: MESSAGES_REGISTRY.AUTH.INVALID_EMAIL_OR_PHONE,
      payload: null,
    };
  }

  const user = await fetchSingleUser({
    identifier,
    flags: {
      lean: true,
      identifierType: isEmail ? "EMAIL" : "PHONE_NUMBER",
      skipFilter: true,
    },
  });

  if (!user) {
    return {
      status: "NOT_FOUND",
      transInfo: MESSAGES_REGISTRY.AUTH.USER_NOT_FOUND,
      payload: null,
    };
  }

  const record = await SecurityQuestionModel.findOne({
    userId: user._id,
  }).lean();

  if (!record || !record.questions || record.questions.length === 0) {
    return {
      status: "RESTRICTION",
      transInfo: MESSAGES_REGISTRY.AUTH.SECURITY_QUESTIONS_NOT_CONFIGURED,
      payload: null,
    };
  }

  const questions = record.questions.map((q) => q.question);

  return {
    status: "SUCCESS",
    transInfo: MESSAGES_REGISTRY.AUTH.SECURITY_QUESTIONS_FETCHED,
    payload: {
      questions,
    },
  };
};
