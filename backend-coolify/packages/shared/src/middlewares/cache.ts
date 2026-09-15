import { Response, NextFunction } from "express";
import { IAuthRequest } from "../types/general";
import {
  INVALIDATE_CACHE,
  InvalidateEvent,
  InvalidatePostOptions,
} from "../constants/invalidators";

const MUTATION_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/**
 * Express middleware to automatically trigger user cache invalidations on successful mutations.
 */
export const autoInvalidateUserCache = (eventType: InvalidateEvent) => {
  return (req: IAuthRequest, res: Response, next: NextFunction): void => {
    res.on("finish", () => {
      const isMutation = MUTATION_METHODS.has(req.method.toUpperCase());
      const isSuccess = res.statusCode >= 200 && res.statusCode < 300;

      if (isMutation && isSuccess) {
        INVALIDATE_CACHE.forUserFromRequest(req, eventType).catch(
          (err: unknown) => {
            console.error("User cache invalidation error:", err);
          },
        );
      }
    });

    next();
  };
};

/**
 * Express middleware to automatically trigger post cache invalidations on successful mutations.
 */
export const autoInvalidatePostCache = (params: InvalidatePostOptions) => {
  const {
    postType: defaultPostType,
    invalidatePostTypeFeed,
    invalidateGlobalFirstPage,
    invalidatePostLanguages,
  } = params;

  return (req: IAuthRequest, res: Response, next: NextFunction): void => {
    res.on("finish", () => {
      const isMutation = MUTATION_METHODS.has(req.method.toUpperCase());
      const isSuccess = res.statusCode >= 200 && res.statusCode < 300;

      if (isMutation && isSuccess) {
        INVALIDATE_CACHE.forPostFromRequest(req, {
          postType: defaultPostType,
          invalidatePostTypeFeed,
          invalidateGlobalFirstPage,
          invalidatePostLanguages,
        }).catch((err: unknown) => {
          console.error("Post cache invalidation error:", err);
        });
      }
    });

    next();
  };
};
