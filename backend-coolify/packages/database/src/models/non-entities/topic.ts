import { Model, Schema, model } from "mongoose";
import { ITopicDocument, IAiSuggestedTopicDocument } from "../../types/others";

const TopicSchema = new Schema<ITopicDocument>(
  {
    title: { type: String, required: true },
    oldTitle: { type: String, default: null },
    userCount: { type: Number, required: true, default: 0 },
    postCount: { type: Number, required: true, default: 0 },
    createdById: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    createdByType: {
      type: String,
      enum: ["SYSTEM", "ADMIN"],
      default: "SYSTEM",
    },
  },
  { timestamps: true },
);

// Topic Schema Indexes
TopicSchema.index({ title: 1 }, { unique: true });
TopicSchema.index({ postCount: -1 });
TopicSchema.index({ userCount: -1 });

/**
 * Model schema for tracking topics and aggregated usage metrics.
 */
export const TopicModel: Model<ITopicDocument> = model<ITopicDocument>(
  "Topic",
  TopicSchema,
  "topics",
);

const AiSuggestedTopicSchema = new Schema<IAiSuggestedTopicDocument>(
  {
    title: { type: String, required: true, trim: true, lowercase: true },
    relatedPostType: {
      type: String,
      enum: ["Gist", "Stake"],
      default: "Gist",
    },
    relatedPostId: {
      type: Schema.Types.ObjectId,
      refPath: "relatedPostType",
      default: null,
    },
    status: {
      type: String,
      enum: ["PENDING", "ACCEPTED", "DECLINED"],
      default: "PENDING",
    },
  },
  { timestamps: true },
);

// Indexes
AiSuggestedTopicSchema.index({ title: 1 });
AiSuggestedTopicSchema.index({ status: 1 });

/**
 * Model schema for tracking AI suggested topics pending admin review.
 */
export const AiSuggestedTopicModel: Model<IAiSuggestedTopicDocument> =
  model<IAiSuggestedTopicDocument>(
    "AiSuggestedTopic",
    AiSuggestedTopicSchema,
    "ai_suggested_topics",
  );
