import { Types, Document } from "mongoose";
import { ResourceStatus, ResourceType, ReviewStatus } from "./others";

export type PublicFigureCategory =
  | "POLITICIAN"
  | "ARTISTE"
  | "ENTREPRENEUR"
  | "ATHLETE"
  | "JOURNALIST"
  | "CONTENT_CREATOR"
  | "EXECUTIVE"
  | "ACADEMIC"
  | "GOVERNMENT_OFFICIAL"
  | "ORGANIZATION";

export interface IPublicFigureSignals {
  hasWikipedia?: boolean;
  hasVipEmail?: boolean;
  hasVipPhone?: boolean;
  hasPressCoverage?: boolean;
  isSearchVerified?: boolean;
}

export interface IPublicFigureBase {
  publicName?: string | null;
  legalName?: string | null;
  publicEmail?: string | null;
  accountEmail?: string | null;
  category?: PublicFigureCategory;
  notabilityScore: number;
  networth?: string | null;
  description?: string | null;
  milestone?: string | null;
  notableWorks?: string[];
  officialWebsite?: string | null;
  socialLinks?: Record<string, string>;
  signals?: IPublicFigureSignals;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IPublicFigureRequest extends IPublicFigureBase {
  userId: Types.ObjectId;
  reviewStatus?: ReviewStatus;
  rejectionReason?: string | null;
  reviewedBy?: Types.ObjectId | null;
  reviewedByType?: ResourceType | null;
  reviewedAt?: Date | null;
}

export interface IPublicFigureRequestDocument
  extends IPublicFigureRequest, Document {}

export interface IPublicFigure extends IPublicFigureBase {
  userId: Types.ObjectId;
  requestId?: Types.ObjectId | null;
  status?: ResourceStatus;
  revokedAt?: Date | null;
  revokedBy?: Types.ObjectId | null;
  revokedByType?: ResourceType | null;
  revocationReason?: string | null;
  lastExternalRefreshAt?: Date | null;
}

export interface IPublicFigureDocument extends IPublicFigure, Document {}
