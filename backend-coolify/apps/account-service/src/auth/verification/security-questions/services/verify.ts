import { SecurityQuestionModel } from "@repo/database";
import {
  detectIdentifierType,
  fetchSingleUser,
  MESSAGES_REGISTRY,
  TransInfo,
} from "@repo/shared";
import { verifyEncryptedPass } from "../../../helpers/encrypt";

export interface IAnswerPair {
  question: string;
  answer: string;
}

export interface IVerificationInput {
  userId?: string;
  identifier?: string;
  answers: IAnswerPair[];
}

export interface IVerificationResult {
  status:
    | "SUCCESS"
    | "MISSING_INPUT"
    | "INVALID_IDENTIFIER"
    | "NOT_FOUND"
    | "RESTRICTION"
    | "INVALID_ANSWERS";
  transInfo: TransInfo;
  payload: {
    verified: boolean;
    invalidQuestions?: string[];
  } | null;
}

/**
 * Validates provided answers against stored security question hashes.
 */
export const executeVerifySecurityQuestions = async (
  input: IVerificationInput,
): Promise<IVerificationResult> => {
  const { identifier, answers, userId } = input;

  if (
    !userId ||
    !identifier ||
    !answers ||
    !Array.isArray(answers) ||
    answers.length === 0
  ) {
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

  const invalidQuestions: string[] = [];

  // Evaluate all answers to capture every invalid submission
  for (const provided of answers) {
    const rawQuestion = provided.question.trim();
    const matchedQuestion = record.questions.find(
      (q) => q.question.toLowerCase() === rawQuestion.toLowerCase(),
    );

    if (!matchedQuestion) {
      invalidQuestions.push(rawQuestion);
      continue;
    }

    const isMatch = await verifyEncryptedPass(
      provided.answer,
      matchedQuestion.answerHash,
    );

    if (!isMatch) {
      invalidQuestions.push(rawQuestion);
    }
  }

  if (invalidQuestions.length > 0) {
    return {
      status: "INVALID_ANSWERS",
      transInfo: MESSAGES_REGISTRY.AUTH.SECURITY_QUESTIONS_MISMATCH,
      payload: {
        verified: false,
        invalidQuestions,
      },
    };
  }

  return {
    status: "SUCCESS",
    transInfo: MESSAGES_REGISTRY.AUTH.SECURITY_QUESTIONS_VERIFIED_SUCCESS,
    payload: {
      verified: true,
    },
  };
};
