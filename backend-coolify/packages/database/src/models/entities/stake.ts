import { Model, Schema, model } from "mongoose";
import { IStakeDocument } from "../../types/post";
import { POST_NESTED_FIELDS } from "../../constants/fields";

const StakeSchema = new Schema<IStakeDocument>(
  {
    authorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    postType: {
      type: String,
      required: true,
      enum: ["Gist"],
      default: null,
    },
    postId: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: "postType",
      default: null,
    },
    // The shell only needs a placeholder for the initial text
    latestCaption: {
      captionId: {
        type: Schema.Types.ObjectId,
        ref: "PostCaption",
      },
      caption: { type: String, required: true },
      detectedLanguage: { type: String, default: "en" },
      createdAt: { type: Date, default: Date.now, required: false },
    },
    // References to be filled by the Worker
    mediaIds: [{ type: Schema.Types.ObjectId, ref: "Media" }],
    topics: [{ type: String }],

    // Geographical data (assigned in the Controller)
    location: {
      name: { type: String, default: null },
      city: { type: String, default: null },
      state: { type: String, default: null },
      country: { type: String, default: null },
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        index: "2dsphere",
        default: [],
      },
    },
    viewCount: { type: Number, default: 0, min: 0 },

    // UI Configuration
    visibility: {
      type: String,
      enum: ["PUBLIC", "FOLLOWERS", "PRIVATE", "MENTIONED_ONLY"],
      default: "PUBLIC",
    },
    hasSensitiveGraphic: { type: Boolean, default: false },

    // --- Moderation State ---
    status: {
      type: String,
      enum: [
        "PUBLISHED",
        "DELETED",
        "SHADOWBANNED",
        "ARCHIVED",
        "UNDER_REVIEW",
        "BANNED",
      ],
      default: "UNDER_REVIEW", // Always start here for the worker flow
    },
    moderationCase: {
      caseId: {
        type: Schema.Types.ObjectId,
        ref: "ModerationCase",
        default: null,
      },
      caseCount: { type: Number, default: 0 },
    },
  },
  { timestamps: true },
);

// --- Stake Schema Index Configurations ---
// Main feed and thread replies retrieval
StakeSchema.index({ postId: 1, postType: 1, status: 1, createdAt: -1 });
// User engagement history query
StakeSchema.index({ authorId: 1, status: 1, createdAt: -1 });
// Automated worker processing queue for draft or under-review stakes
StakeSchema.index({ status: 1, createdAt: 1 });
// Spatial distribution queries for stakes
StakeSchema.index({
  [POST_NESTED_FIELDS.LOCATION_COORDINATES]: "2dsphere",
  status: 1,
});

export const StakeModel: Model<IStakeDocument> = model<IStakeDocument>(
  "Stake",
  StakeSchema,
  "stakes",
);
