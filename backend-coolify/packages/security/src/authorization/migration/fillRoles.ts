import {
  UserModel,
  ROLES,
  PermissionModel,
  RoleModel,
  RolePermissionModel,
  PERMISSIONS,
} from "@repo/database";
import { assignUserRole } from "../helpers";

/**
 * Backfills standard community role to all existing active users.
 */
export const backfillExistingUserRoles = async (): Promise<void> => {
  const usersWithoutRoles = await UserModel.aggregate([
    {
      $lookup: {
        from: "user_roles",
        let: { userId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$userId", "$$userId"] },
                  { $eq: ["$effectiveTo", null] },
                ],
              },
            },
          },
        ],
        as: "activeRoles",
      },
    },
    { $match: { activeRoles: { $size: 0 } } },
    { $project: { _id: 1 } },
  ]);

  for (const user of usersWithoutRoles) {
    await assignUserRole({
      userId: user._id,
      roleName: ROLES.COMMUNITY.USER,
      assignedByType: "SYSTEM",
      reason: "Automated baseline role backfill",
    });
  }
};

/**
 * Initializes and seeds baseline system roles, permissions, and role mappings.
 */
export const seedRolesAndPermissions = async (): Promise<void> => {
  // 1. Seed Permissions
  const permissionDocs = [];
  for (const group of Object.values(PERMISSIONS)) {
    for (const name of Object.values(group)) {
      const [resource, ...actionParts] = name.split(".");
      const action = actionParts.join(".");
      permissionDocs.push({ name, resource, action });
    }
  }
  await PermissionModel.bulkWrite(
    permissionDocs.map((perm) => ({
      updateOne: {
        filter: { name: perm.name },
        update: { $setOnInsert: perm },
        upsert: true,
      },
    })),
  );

  // 2. Seed Roles
  const roleDocs = [
    ...Object.values(ROLES.PLATFORM).map((name) => ({
      name,
      category: "PLATFORM" as const,
    })),
    ...Object.values(ROLES.COMMUNITY).map((name) => ({
      name,
      category: "COMMUNITY" as const,
    })),
  ];

  await RoleModel.bulkWrite(
    roleDocs.map((role) => ({
      updateOne: {
        filter: { name: role.name },
        update: { $setOnInsert: role },
        upsert: true,
      },
    })),
  );

  // Fetch all persisted permissions & roles
  const allPermissions = await PermissionModel.find().lean();
  const allRoles = await RoleModel.find().lean();

  const roleMap = new Map(allRoles.map((r) => [r.name, r._id]));
  const permMap = new Map(allPermissions.map((p) => [p.name, p._id]));

  const rolePermissionMappings: { roleId: any; permissionId: any }[] = [];

  // 3. Grant SUPER_ADMIN Full Privileges across all system permissions
  const superAdminRoleId = roleMap.get(ROLES.PLATFORM.SUPER_ADMIN);
  if (superAdminRoleId) {
    allPermissions.forEach((perm) => {
      rolePermissionMappings.push({
        roleId: superAdminRoleId,
        permissionId: perm._id,
      });
    });
  }

  // 4. Map Default Permissions to Baseline Community Roles
  const userRoleId = roleMap.get(ROLES.COMMUNITY.USER);
  if (userRoleId) {
    const baseUserPermissions = [
      PERMISSIONS.POST.CREATE,
      PERMISSIONS.POST.READ,
      PERMISSIONS.COMMENT.CREATE,
      PERMISSIONS.COMMENT.READ,
      PERMISSIONS.USER.VIEW_PROFILE,
      PERMISSIONS.USER.EDIT_PROFILE,
      PERMISSIONS.DEVICE.READ,
      PERMISSIONS.TOPIC.SYNC_POST_TOPICS,
      PERMISSIONS.TOPIC.SYNC_USER_TOPICS,
      PERMISSIONS.TOPIC.VIEW_POST_TOPICS,
      PERMISSIONS.TOPIC.VIEW_USER_TOPICS,
    ];

    baseUserPermissions.forEach((permName) => {
      const permId = permMap.get(permName);
      if (permId) {
        rolePermissionMappings.push({
          roleId: userRoleId,
          permissionId: permId,
        });
      }
    });
  }

  // 5. Bulk write role-permission relations
  if (rolePermissionMappings.length > 0) {
    await RolePermissionModel.bulkWrite(
      rolePermissionMappings.map((rp) => ({
        updateOne: {
          filter: { roleId: rp.roleId, permissionId: rp.permissionId },
          update: { $setOnInsert: rp },
          upsert: true,
        },
      })),
    );
  }
};
