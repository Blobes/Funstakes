"use client";

import { IGistPayload, IStakePayload } from "./post";
import { IUserPayload } from "./user";

export interface IContentModeration {
  caseId?: string;
  caseCount?: number;
}

export type FetchStatus =
  | "SUCCESS"
  | "UNAUTHORIZED"
  | "ERROR"
  | "INFO"
  | "WARNING"
  | "FORBIDDEN"
  | "TIMEOUT"
  | "NETWORK_ERROR"
  | "NO_AUTH_FLAG"
  | null;

export interface ApiError extends Error {
  httpStatus: number;
  status: FetchStatus;
  payload: any | null;
  localizedErrMsg?: string;
  retryAfter?: number | null;
  statusType?: "ACCOUNT_NOT_FOUND" | "ACCOUNT_ALREADY_EXISTS";
}

export interface APITransMsg {
  message?: string;
  localizedSuccessMsg?: string;
  i18nKey?: string;
  interpolations?: Record<string, any>;
}

export interface ISinglePayload<T> extends APITransMsg {
  payload: T | null;
  status: FetchStatus;
  httpStatus?: number;
}

export interface ListMetaData {
  totalDocs: number;
  totalPages: number;
  currentPage: number;
  limit: number;
  hasNextPage: boolean;
}

export interface IListPayload<T> {
  message: string;
  payload: T[] | null;
  status: FetchStatus;
  httpStatus?: number;
  metaData?: ListMetaData;
}

export interface IUser extends IUserPayload {
  lastSeen?: string;
}

export interface IGist extends IGistPayload {}

export interface IStake extends IStakePayload {}

export type IPost =
  | (IGist & { postType: "GIST" })
  | (IStake & { postType: "STAKE" });

export interface ITopicPayload {
  title?: string;
  userCount?: number;
  postCount?: number;
  createdAt?: Date;
  updatedAt?: Date;
}
