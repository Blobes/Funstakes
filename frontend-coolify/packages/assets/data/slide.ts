"use client";

import { COMMON_CAROUSEL, IBGFadeSlideData, ITranslation } from "@repo/core";
import { asset } from "./media";

export const BG_SLIDER_DATA = (
  translator?: (transData: ITranslation) => string,
): IBGFadeSlideData[] => {
  const translate = (transData: ITranslation) => {
    return translator ? translator(transData) : transData.tValue;
  };

  return [
    {
      name: translate(COMMON_CAROUSEL.marketing001.slide1_name),
      headline: translate(COMMON_CAROUSEL.marketing001.slide1_headline),
      tagline: translate(COMMON_CAROUSEL.marketing001.slide1_tagline),
      media: {
        _id: "m1",
        url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80",
        type: "IMAGE",
      },
    },
    {
      name: translate(COMMON_CAROUSEL.marketing001.slide2_name),
      headline: translate(COMMON_CAROUSEL.marketing001.slide2_headline),
      tagline: translate(COMMON_CAROUSEL.marketing001.slide2_tagline),
      media: {
        _id: "m2",
        url: asset.marketingVideo,
        thumbnailUrl: asset.marketingPoster,
        type: "VIDEO",
      },
    },
    {
      name: translate(COMMON_CAROUSEL.marketing001.slide3_name),
      headline: translate(COMMON_CAROUSEL.marketing001.slide3_headline),
      tagline: translate(COMMON_CAROUSEL.marketing001.slide3_tagline),
      media: {
        _id: "m3",
        url: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80",
        type: "IMAGE",
      },
    },
    {
      name: translate(COMMON_CAROUSEL.marketing001.slide4_name),
      headline: translate(COMMON_CAROUSEL.marketing001.slide4_headline),
      tagline: translate(COMMON_CAROUSEL.marketing001.slide4_tagline),
      media: {
        _id: "m4",
        url: "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=1200&q=80",
        type: "IMAGE",
      },
    },
  ] as IBGFadeSlideData[];
};
