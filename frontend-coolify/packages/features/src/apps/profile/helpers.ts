"use client";

import { QueryClient } from "@tanstack/react-query";
import { getEntityFromCache } from "@repo/helpers";
import { CACHE_KEYS, IUser } from "@repo/core";

export const getUserFromCache = (
  queryClient: QueryClient,
  userId: string,
  contextUserId?: string,
): IUser | undefined =>
  getEntityFromCache<IUser>({
    queryClient,
    entityId: userId,
    granularKeys: [[CACHE_KEYS.USER.TARGET, userId]],
    listKeys: contextUserId ? [[CACHE_KEYS.USER.FOLLOWERS, contextUserId]] : [],
    extractList: (data) => data as IUser[] | undefined,
  });
