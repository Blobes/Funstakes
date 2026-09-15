import { Model, Schema, model } from "mongoose";
import {
  ADMIN_PERMISSIONS,
  ADS_PERMISSIONS,
  COMMENT_PERMISSIONS,
  DEVICE_PERMISSIONS,
  POST_PERMISSIONS,
  REPORT_PERMISSIONS,
  TOPIC_PERMISSIONS,
  USER_PERMISSIONS,
  WALLET_PERMISSIONS,
} from "../../../constants/permissions";
import {
  IPermissionDocument,
  IRolePermissionDocument,
} from "../../../types/authorization";

const allPermissionNames = [
  ...Object.values(POST_PERMISSIONS),
  ...Object.values(TOPIC_PERMISSIONS),
  ...Object.values(DEVICE_PERMISSIONS),
  ...Object.values(COMMENT_PERMISSIONS),
  ...Object.values(USER_PERMISSIONS),
  ...Object.values(ADMIN_PERMISSIONS),
  ...Object.values(REPORT_PERMISSIONS),
  ...Object.values(WALLET_PERMISSIONS),
  ...Object.values(ADS_PERMISSIONS),
];

const PermissionSchema = new Schema<IPermissionDocument>(
  {
    name: {
      type: String,
      required: true,
      enum: allPermissionNames,
    },
    resource: {
      type: String,
      required: true,
    },
    action: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: null,
    },
  },
  { timestamps: true },
);
// Permission Schema Indexes
PermissionSchema.index({ name: 1 }, { unique: true });
/**
 * Model schema for defining granular access control permissions.
 */
export const PermissionModel: Model<IPermissionDocument> =
  model<IPermissionDocument>("Permission", PermissionSchema, "permissions");

// Role Permission
const RolePermissionSchema = new Schema<IRolePermissionDocument>(
  {
    roleId: {
      type: Schema.Types.ObjectId,
      ref: "Role",
      required: true,
    },
    permissionId: {
      type: Schema.Types.ObjectId,
      ref: "Permission",
      required: true,
    },
  },
  { timestamps: true },
);

// Role Permission Schema Indexes
RolePermissionSchema.index({ roleId: 1 });
RolePermissionSchema.index({ permissionId: 1 });
RolePermissionSchema.index({ roleId: 1, permissionId: 1 }, { unique: true });

/**
 * Model schema for mapping permissions to user roles.
 */
export const RolePermissionModel: Model<IRolePermissionDocument> =
  model<IRolePermissionDocument>(
    "RolePermission",
    RolePermissionSchema,
    "role_permissions",
  );
