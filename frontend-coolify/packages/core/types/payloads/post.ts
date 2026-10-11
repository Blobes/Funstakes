"use client";

import { IMedia } from "../media";
import { ILocation } from "../ui-props";
import { IContentModeration } from "./modified";

export type PostVisibility =
  | "PUBLIC"
  | "FOLLOWERS"
  | "PRIVATE"
  | "MENTIONED_ONLY";

export type PostStatus =
  | "PUBLISHED"
  | "DELETED"
  | "SHADOWBANNED"
  | "ARCHIVED"
  | "UNDER_REVIEW"
  | "BANNED";

export type PostType = "GIST" | "STAKE";

export interface IPostAuthor {
  _id: string;
  username: string | null;
  displayName: string;
  profileImage: string | null;
  isFollowing?: boolean;
  followsMe?: boolean;
}

export interface IGistPayload {
  _id: string;
  authorId: string;
  media: IMedia[];
  author: IPostAuthor;

  latestCaption: {
    captionId: string;
    caption: string;
    detectedLanguage?: string;
    createdAt?: string;
  };

  editCount: number;

  // Engagement & Metrics
  likeCount: number;
  commentCount: number;
  shareCount: number;
  viewCount: number;

  // Discovery
  topics: string[];
  location?: ILocation;

  // Configuration
  visibility: PostVisibility;
  allowComments: boolean;
  isPinned: boolean;
  hasSensitiveGraphic: boolean;

  // Moderation
  status: PostStatus;
  moderationCase?: IContentModeration;

  // UI State Flags
  isEdited: boolean;
  likedByMe: boolean;

  createdAt: string;
  updatedAt: string;
}

export interface IStakePayload {
  _id: string;
  authorId: string;
  author: IPostAuthor;
  content: string;
  media: IMedia[];
  createdAt: string | number;
}
