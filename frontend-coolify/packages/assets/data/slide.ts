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
        url: asset.marketingImg1,
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
        url: asset.marketingImg2,
        type: "IMAGE",
      },
    },
    {
      name: translate(COMMON_CAROUSEL.marketing001.slide4_name),
      headline: translate(COMMON_CAROUSEL.marketing001.slide4_headline),
      tagline: translate(COMMON_CAROUSEL.marketing001.slide4_tagline),
      media: {
        _id: "m4",
        url: asset.marketingImg3,
        type: "IMAGE",
      },
    },
  ] as IBGFadeSlideData[];
};
