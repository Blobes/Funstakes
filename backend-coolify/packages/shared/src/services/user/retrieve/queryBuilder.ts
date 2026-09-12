import mongoose, { Query, QueryFilter } from "mongoose";
import { IUserDocument, UserModel } from "@repo/database";
import { InputCheckType } from "../../../types/general";
import { normalizeValue, transformToASCII } from "../../../utils/hash";
import { detectIdentifierType } from "../../../utils/sanitizeData";

export interface BuildQueryOptions {
  identifier?: string | mongoose.Types.ObjectId;
  identifierType?: InputCheckType;
  customQuery?: QueryFilter<IUserDocument>;
  skipFilter?: boolean;
}

export class UserQueryBuilder {
  /**
   * Constructs the executable query targeting model statics for encrypted email/phone fields.
   */
  static buildQuery(options: BuildQueryOptions): Query<unknown, IUserDocument> {
    const {
      identifier,
      identifierType,
      customQuery,
      skipFilter = false,
    } = options;

    if (identifier) {
      const isExplicitUsername = identifierType === "USERNAME";

      // Check _id only if the identifier is not explicitly passed as a USERNAME
      // and matches a valid ObjectId or ObjectId instance.
      if (
        !isExplicitUsername &&
        (identifier instanceof mongoose.Types.ObjectId ||
          mongoose.Types.ObjectId.isValid(identifier))
      ) {
        return UserModel.findOne({
          _id: identifier,
          ...customQuery,
        }).setOptions({
          skipFilter,
        }) as unknown as Query<unknown, IUserDocument>;
      }

      const formattedValue = normalizeValue(identifier.toString());
      const checkType = identifierType || detectIdentifierType(formattedValue);

      if (checkType === "EMAIL") {
        return UserModel.findByEmail({
          email: formattedValue.toLowerCase(),
          filter: customQuery,
          options: { skipFilter },
        }) as unknown as Query<unknown, IUserDocument>;
      }

      if (checkType === "PHONE_NUMBER") {
        return UserModel.findByPhone({
          phoneNumber: formattedValue.replace(/\D/g, ""),
          filter: customQuery,
          options: { skipFilter },
        }) as unknown as Query<unknown, IUserDocument>;
      }

      const canonical = transformToASCII(formattedValue);
      return UserModel.findOne({
        usernameCanonical: canonical,
        ...customQuery,
      }).setOptions({ skipFilter }) as unknown as Query<unknown, IUserDocument>;
    }

    return UserModel.find(customQuery || {}).setOptions({
      skipFilter,
    }) as unknown as Query<unknown, IUserDocument>;
  }

  /**
   * Builds Mongoose select projection from field arrays.
   */
  static buildProjection(fields?: string[]): string | undefined {
    if (!fields || fields.length === 0) {
      return undefined;
    }
    const fieldSet = new Set(fields);
    fieldSet.add("_id");
    return Array.from(fieldSet).join(" ");
  }
}
