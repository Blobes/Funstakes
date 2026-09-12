import { Schema, model } from "mongoose";
import { IUserDocument, IUserModelStatic, QueryConfig } from "../../types/user";
import { encryptedFieldsPlugin } from "../../helpers/encryptionPlugin";
import { schemaSyncPlugin } from "../../migration/schemaSyncPlugin";

/**
 * User Schema Configuration
 */
const UserSchema = new Schema<IUserDocument, IUserModelStatic>(
  {
    // --- CORE IDENTITY ---
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    username: {
      type: String,
      trim: true,
    },
    usernameCanonical: {
      type: String,
      trim: true,
    },
    password: { type: String, default: null },
    firstName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },
    phoneNumber: {
      type: String,
    },

    // --- AUTHENTICATION & SECURITY ---
    signedUpWith: {
      type: String,
      enum: ["EMAIL", "GOOGLE", "APPLE"],
      default: "EMAIL",
    },
    oAuthId: { type: String, default: null },
    isEmailVerified: { type: Boolean, default: false },
    isPhoneVerified: { type: Boolean, default: false },
    lastPasswordVerifiedAt: { type: Date, default: null },
    totpAuth: {
      secret: { type: String, default: null },
      backupCodes: { type: [String], default: [] },
      tempSecret: { type: String, default: null },
      tempBackupCodes: { type: [String], default: [] },
    },
    hasEnabledMFA: { type: Boolean, default: false },
    securityQuestionsId: {
      type: Schema.Types.ObjectId,
      ref: "SecurityQuestion",
      default: null,
    },

    // --- OTP VERIFICATION ---
    otpCode: { type: String, default: null },
    otpCodeExpiresAt: { type: Date, default: null },
    lastEmailOtpSentAt: { type: Date, default: null },
    lastPhoneOtpSentAt: { type: Date, default: null },

    // --- IDENTITY UPDATES ---
    pendingEmail: { type: String, default: null, lowercase: true },
    lastEmailChangeAt: { type: Date, default: null },
    lastPhoneChangeAt: { type: Date, default: null },
    lastUsernameChangeAt: { type: Date, default: null },
    pendingPhoneNumber: { type: String, default: null },

    // --- ACCOUNT STATUS & VISIBILITY ---
    accountStatus: {
      type: String,
      enum: ["ACTIVE", "INACTIVE", "DEACTIVATED", "SUSPENDED", "BANNED"],
      default: "ACTIVE",
    },
    accountVisibility: {
      type: String,
      enum: ["PUBLIC", "PRIVATE"],
      default: "PUBLIC",
    },
    lastActiveAt: { type: Date, default: null },
    statusChangedAt: {
      type: Date,
      default: Date.now,
    },
    statusReason: {
      type: String,
      default: null,
    },
    statusChangedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // --- VERIFICATION & NOTABILITY ---
    isKycVerified: { type: Boolean, default: false },
    isPublicFigure: { type: Boolean, default: false },
    meritsVerification: { type: Boolean, default: false },
    isNotable: { type: Boolean, default: false },
    kycSubmitRequest: {
      type: Schema.Types.ObjectId,
      ref: "KycRequest",
      default: null,
    },
    kycReviewStatus: {
      type: String,
      enum: ["NONE", "PENDING", "APPROVED", "REJECTED"],
      default: "NONE",
    },
    verificationSignals: {
      hasWikipedia: { type: Boolean, default: false },
      isVipEmail: { type: Boolean, default: false },
      isVipPhone: { type: Boolean, default: false },
    },
    isAgeVerified: { type: Boolean, default: false },

    // --- USER DEVICES ---
    primaryDeviceId: {
      type: Schema.Types.ObjectId,
      ref: "Device",
      default: null,
    },

    // --- MODERATION & COMPLIANCE ---
    policyBreachCount: { type: Number, default: 0 },
    hasFlaggedPost: { type: Boolean, default: false },
    postCountWindow: { type: Number, default: 0 },

    // --- PROFILE DETAILS ---
    gender: { type: String, default: null },
    dateOfBirth: { type: String, default: null },
    about: { type: String, default: null },
    occupation: { type: String, default: null },
    relationship: { type: String, default: null },
    website: { type: String, default: null },
    address: { type: String, default: null },

    // --- PROFILE ASSETS ---
    profileImage: { type: Schema.Types.ObjectId, ref: "Media", default: null },
    coverImage: { type: Schema.Types.ObjectId, ref: "Media", default: null },

    // --- ONBOARDING & GEOGRAPHY ---
    isOnboarded: { type: Boolean, default: false },
    onboardingStep: { type: String, default: null },

    // --- ACCOUNT LOCATION ---
    location: {
      name: { type: String, default: null },
      city: { type: String, default: null },
      state: { type: String, default: null },
      country: { type: String, default: null },
      region: { type: String, default: null },
      continent: { type: String, default: null },
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        default: [],
      },
    },

    // --- METRICS & PREFERENCES ---
    followersCount: { type: Number, default: 0 },
    followingCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

// --- User Schema Index Configurations ---
// Core Identity Lookup Indexes
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ username: 1 }, { unique: true, sparse: true });
UserSchema.index({ usernameCanonical: 1 }, { unique: true, sparse: true });
UserSchema.index({ phoneNumber: 1 }, { unique: true, sparse: true });
// Account Lifecycle & Sorting
UserSchema.index({ createdAt: 1 });
UserSchema.index({ statusChangedAt: 1 });
UserSchema.index({ lastActiveAt: 1 });
UserSchema.index({ accountStatus: 1 });
UserSchema.index({ followersCount: 1 });
UserSchema.index({ postCountWindow: 1 });
// Verification Workflow Compound Lookup
UserSchema.index({
  meritsVerification: 1,
  isPublicFigure: 1,
  isEmailVerified: 1,
});
// Geospatial Queries for Account Location
UserSchema.index({ "location.coordinates": "2dsphere" });

// --- Plugin Registrations ---
// Register schema sync plugin before encryption plugin
UserSchema.plugin(schemaSyncPlugin);
// Transparent encryption configuration plugin
UserSchema.plugin(encryptedFieldsPlugin, {
  fields: [
    { field: "email", searchable: true },
    { field: "phoneNumber", searchable: true },
  ],
});

// --- Static Model Methods ---
UserSchema.statics.findByEmail = function (
  this: IUserModelStatic,
  config: QueryConfig & { email: string },
) {
  const { email, filter, options } = config;
  return this.findByEncryptedField("email", email, filter, options);
};

UserSchema.statics.findByPhone = function (
  this: IUserModelStatic,
  config: QueryConfig & { phoneNumber: string },
) {
  const { phoneNumber, filter, options } = config;
  return this.findByEncryptedField("phoneNumber", phoneNumber, filter, options);
};

// --- User Model Definition ---
export const UserModel = model<IUserDocument, IUserModelStatic>(
  "User",
  UserSchema,
  "users",
);
