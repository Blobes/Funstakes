import { Model, Schema, model } from "mongoose";
import { IBlockedUserDocument, IFollowDocument } from "../../types/others";

// User follows
const FollowSchema = new Schema<IFollowDocument>(
  {
    followerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    followingId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

// Follow Schema Indexes
FollowSchema.index({ followerId: 1, followingId: 1 }, { unique: true });
FollowSchema.index({ followingId: 1 });

/**
 * Model schema for tracking user follow relationships.
 */
export const FollowModel: Model<IFollowDocument> = model<IFollowDocument>(
  "Follow",
  FollowSchema,
  "follows",
);

// Blocking users
const BlockedUserSchema = new Schema<IBlockedUserDocument>(
  {
    blockerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    blockedId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

// Blocked User Schema Indexes
BlockedUserSchema.index({ blockerId: 1, blockedId: 1 }, { unique: true });
BlockedUserSchema.index({ blockedId: 1 });

/**
 * Model schema for tracking blocked user relationships.
 */
export const BlockedModel: Model<IBlockedUserDocument> =
  model<IBlockedUserDocument>(
    "BlockedUser",
    BlockedUserSchema,
    "blocked_users",
  );
