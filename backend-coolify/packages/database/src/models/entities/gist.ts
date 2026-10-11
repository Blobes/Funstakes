import { Schema, model, Model } from "mongoose";
import { IGistDocument } from "../../types/post";
import { POST_NESTED_FIELDS } from "../../constants/fields";

const GistSchema = new Schema<IGistDocument>(
  {
    authorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    mediaIds: [{ type: Schema.Types.ObjectId, ref: "Media" }],

    latestCaption: {
      captionId: {
        type: Schema.Types.ObjectId,
        ref: "PostCaption",
      },
      caption: { type: String, required: true },
      detectedLanguage: { type: String, default: "en" },
      createdAt: { type: Date, default: Date.now, required: false },
    },
    editCount: { type: Number, default: 0 },

    // Engagement & Metrics
    likeCount: { type: Number, default: 0, min: 0 },
    commentCount: { type: Number, default: 0, min: 0 },
    shareCount: { type: Number, default: 0, min: 0 },
    viewCount: { type: Number, default: 0, min: 0 },

    // Discovery & Categorization
    topics: { type: [{ type: String }], default: [] },
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

    // Configuration
    visibility: {
      type: String,
      enum: ["DRAFT", "PUBLIC", "FRIENDS_ONLY", "FOLLOWERS", "MENTIONS_ONLY"],
      default: "PUBLIC",
    },
    allowComments: { type: Boolean, default: true },
    isPinned: { type: Boolean, default: false },
    hasSensitiveGraphic: { type: Boolean, default: false }, // Useful for "Blur" UI filters

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
      default: "ARCHIVED",
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

// --- Index Registrations ---
GistSchema.index({ topics: 1 });
// Primary feed retrieval sorted by recency
GistSchema.index({ status: 1, visibility: 1, createdAt: -1 });
// User profile posts tab query
GistSchema.index({ authorId: 1, status: 1, createdAt: -1 });
// User pinned post retrieval
GistSchema.index({ authorId: 1, isPinned: -1, createdAt: -1 });
// Topic-based feed discovery
GistSchema.index({ topics: 1, status: 1, createdAt: -1 });
// Geospatial querying for location-based feeds
GistSchema.index({
  [POST_NESTED_FIELDS.LOCATION_COORDINATES]: "2dsphere",
  status: 1,
});
// Active moderation review queue lookup
GistSchema.index({ status: 1, [POST_NESTED_FIELDS.MODERATION_CASE_COUNT]: -1 });

export const GistModel: Model<IGistDocument> = model<IGistDocument>(
  "Gist",
  GistSchema,
  "gists",
);
