import { Schema, Document, Model, model } from "mongoose";
import { ISecurityQuestionDocument } from "../../types/others";

const SecurityQuestionSchema = new Schema<ISecurityQuestionDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    questions: [
      {
        _id: false,
        question: { type: String, required: true, trim: true },
        answerHash: { type: String, required: true },
      },
    ],
  },
  { timestamps: true },
);

SecurityQuestionSchema.index({ userId: 1 }, { unique: true });
SecurityQuestionSchema.index({ userId: 1, "questions.question": 1 });

export const SecurityQuestionModel: Model<ISecurityQuestionDocument> =
  model<ISecurityQuestionDocument>(
    "SecurityQuestion",
    SecurityQuestionSchema,
    "security_questions",
  );
