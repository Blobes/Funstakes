"use client";

import { IStake, MediaProps } from "@repo/core";
import { asset } from "..";

export const stakeTestData: IStake[] = [
  {
    _id: "stake1",
    authorId: "1",
    author: {
      _id: "1",
      username: "User1",
      displayName: "User1 Display",
      profileImage: null,
    },
    content: "Stake 1 content",
    media: [
      {
        _id: "media1",
        ownerId: "1",
        url: asset.pic3,
        status: "READY",
      },
    ],
    createdAt: String(new Date("2026-01-12")),
  },
  {
    _id: "stake2",
    authorId: "2",
    author: {
      _id: "2",
      username: "User2",
      displayName: "User2 First",
      profileImage: null,
    },
    content: "Stake 2 content",
    media: [
      {
        _id: "media2",
        ownerId: "2",
        url: asset.pic4,
        status: "READY",
      },
    ],
    createdAt: String(new Date("2025-03-12")),
  },
  {
    _id: "stake3",
    authorId: "3",
    author: {
      _id: "3",
      username: "User3",
      displayName: "User3 First",
      profileImage: null,
    },
    content: "Stake 3 content",
    media: [
      {
        _id: "media3",
        ownerId: "3",
        url: asset.pic1,
        status: "READY",
      },
    ],
    createdAt: String(new Date("2025-09-12")),
  },
];

export const mediaData: MediaProps[] = [
  {
    _id: "media1",
    ownerId: "3",
    url: asset.pic1,
    status: "READY",
  },
  {
    _id: "media2",
    ownerId: "2",
    url: asset.pic2,
    status: "READY",
  },
  {
    _id: "media3",
    ownerId: "2",
    url: asset.marketingVideo,
    type: "VIDEO",
    status: "READY",
  },
  {
    _id: "media4",
    ownerId: "2",
    url: asset.pic3,
    status: "READY",
  },
  {
    _id: "media5",
    ownerId: "1",
    url: asset.pic4,
    status: "READY",
  },
  {
    _id: "media6",
    ownerId: "4",
    url: asset.pic4,
    status: "READY",
  },
  {
    _id: "media7",
    ownerId: "2",
    url: asset.pic4,
    status: "READY",
  },
];
