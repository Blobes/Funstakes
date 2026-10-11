import { Document, Types } from "mongoose";

export type KycRequestType =
  | "VERIFIED_BADGE"
  | "PUBLIC_FIGURE"
  | "AGE_CONFIRMATION"
  | "WALLET_AND_PAYOUT"
  | "ENTERPRISE_SUBSCRIPTION"
  | "DOCUMENT_UPDATE";

export type KycTierType = "NONE" | "TIER_1" | "TIER_2" | "TIER_3" | "TIER_4";

export type KycSubmitMethod = "FILE_UPLOAD" | "URL" | "TEXT";
export type KycReviewStatus =
  | "PENDING"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "CANCELED";

export type IdentityContentType =
  | "PASSPORT"
  | "NATIONAL_IDENTITY_CARD"
  | "DRIVERS_LICENSE"
  | "RESIDENCE_PERMIT_OR_VISA";

export type AddressContentType =
  | "UTILITY_BILLS"
  | "BANK_STATEMENTS"
  | "RENTAL_AGREEMENT";

export type BusinessContentType =
  | "CERTIFICATE_OF_INCORPORATION"
  | "ARTICLES_OF_ORGANIZATION"
  | "BUSINESS_LICENSE"
  | "UBO"
  | "RENTAL_AGREEMENT"
  | "OFFICIAL_WEBSITE_OR_EMAIL";

/**
 * Base request payload schema structure shared across all KYC tiers.
 */
export interface IKycBaseRequest {
  _id?: Types.ObjectId;
  legalFirstName?: string | null;
  legalLastName?: string | null;
  legalMiddleName?: string | null;
  requestType?: KycRequestType | null;
  mediaContent?: Types.ObjectId | string | null;
  textContent?: string | null;
  submitMethod?: KycSubmitMethod;
  reviewStatus?: KycReviewStatus | null;
  isActive?: boolean;
  submittedAt?: Date | null;
  reviewedBy?: Types.ObjectId | string | null;
  reviewedAt?: Date | null;
  rejectionReason?: string | null;
}

/**
 * Proof of Identity request payload schema structure.
 */
export interface IKycIdentityRequest extends IKycBaseRequest {
  contentType?: IdentityContentType | null;
  selfies?: Types.ObjectId[] | string[];
}

/**
 * Proof of Address request payload schema structure.
 */
export interface IKycAddressRequest extends IKycBaseRequest {
  contentType?: AddressContentType | null;
}

/**
 * Proof of Business request payload schema structure.
 */
export interface IKycBusinessRequest extends IKycBaseRequest {
  contentType?: BusinessContentType | null;
}

/**
 * Proof of Financial details request payload schema structure.
 */
export interface IKycFinanceRequest extends Omit<
  IKycBaseRequest,
  "mediaContent" | "textContent" | "submitMethod"
> {
  bankName?: string | null;
  accountName?: string | null;
  accountNumber?: string | null;
  tin?: string | null;
}

/**
 * Tier array mappings for KYC request documents.
 */
export interface IKycTiers {
  identity?: IKycIdentityRequest[];
  address?: IKycAddressRequest[];
  business?: IKycBusinessRequest[];
  finance?: IKycFinanceRequest[];
}

/**
 * Document interface representation for KYC Request entities.
 */
export interface IKycRequestDocument extends Document {
  userId: Types.ObjectId;
  additionalLinks?: string[];
  currentTier: KycTierType;
  requestTiers?: IKycTiers;
  createdAt?: Date;
  updatedAt?: Date;
}
