import { Response } from "express";
import { IAuthRequest, INVALIDATE_CACHE } from "@repo/shared";
import { UserRoleModel, RoleModel } from "@repo/database";

export class RolesController {
  /**
   * Assigns a role to a target user and clears their permission cache in Redis.
   */
  public static async assignRoleToUser(
    req: IAuthRequest,
    res: Response,
  ): Promise<Response> {
    const { targetUserId, roleName, assignmentReason } = req.body;
    const assignedBy = req.user?.id;

    const role = await RoleModel.findOne({ name: roleName });
    if (!role) {
      return res.status(404).json({ message: "Role not found" });
    }

    await UserRoleModel.findOneAndUpdate(
      { userId: targetUserId, roleId: role._id, effectiveTo: null },
      {
        userId: targetUserId,
        roleId: role._id,
        assignedBy,
        assignmentReason,
        effectiveFrom: new Date(),
      },
      { upsert: true, new: true },
    );

    // Invalidate cached role mappings in Redis
    await INVALIDATE_CACHE.forUserRole(roleName);

    return res
      .status(200)
      .json({ message: `Role ${roleName} assigned successfully` });
  }
}
