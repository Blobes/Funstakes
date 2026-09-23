"use client";

import React from "react";
import { IPost, GenericStyle, COMMON_FEEDBACK, POST_INFO } from "@repo/core";
import { useAdaptiveTime } from "@repo/shared-hooks";
import { useTheme } from "@mui/material/styles";
import {
  LinearCarousel,
  PostSkeleton,
  SmartDate,
  SVGWrapper,
  TransText,
  CustomizedMediaRenderer,
  MediaRenderer,
} from "@repo/shared-ui";
import { useTrendingData } from "./hooks/usePostTrends";
import { Box, Stack } from "@mui/material";
import { applyBGPattern, summarizeNum } from "@repo/helpers";
import { Quote } from "lucide-react";
import { asset } from "@repo/assets";

interface TrendingPost {
  post: IPost;
  avatar: string;
  bgColor: string;
  caption: string;
}

/**
 * Individual trending post layout card supporting rich image and embedded video backgrounds.
 */
const TrendingPostCard = ({ data }: { data: TrendingPost }) => {
  const theme = useTheme();
  const hasMedia = data.post.media && data.post.media.length > 0;
  const targetMedia = hasMedia ? data.post.media[0] : null;

  return (
    <Stack
      sx={{
        position: "relative",
        width: "100%",
        height: "100%",
        minHeight: 300,
        alignItems: "flex-start",
        justifyContent: "flex-end",
        borderRadius: 0,
        background: data.bgColor,
        ...(!hasMedia &&
          applyBGPattern({ url: asset.bgNoise, contain: true, opacity: 1 })),
        gap: theme.gap(18),
        padding: theme.boxSpacing(18),
        [theme.breakpoints.down("sm")]: {
          gap: theme.gap(14),
          padding: theme.boxSpacing(16),
        },
      }}
    >
      {/* Background Visual Rendering Block */}
      {hasMedia && targetMedia && (
        <Box sx={{ position: "absolute", inset: 0, zIndex: 1 }}>
          {targetMedia.customizations ? (
            <CustomizedMediaRenderer media={targetMedia} />
          ) : (
            <MediaRenderer media={targetMedia} />
          )}

          {/* Overlay to preserve text contrast readability */}
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.7) 100%)",
            }}
          />
        </Box>
      )}

      {/* Main Content Fields */}
      <TransText
        component="h5"
        trimCount={6}
        sx={{
          ...theme.typography.text1,
          zIndex: 2,
          position: "relative",
          color: "#FFFFFF",
          textShadow: hasMedia ? "0px 2px 8px rgba(0,0,0,0.2)" : "none",
        }}
      >
        {data.caption}
      </TransText>

      {/* Engagement Footer Details */}
      <Box
        sx={{
          zIndex: 2,
          color: "#FFFFFF",
          width: "100%",
          position: "relative",
          display: "flex",
          alignItems: "center",
          gap: theme.gap(6),
        }}
      >
        <SVGWrapper
          src={data.avatar}
          size={42}
          preserveColor={true}
          fallbackUIType="SKELETON"
          sx={{
            flex: "none",
            border: "2px solid #FFFFFF",
            borderRadius: theme.radius.full,
            overflow: "hidden",
          }}
        />
        <Box
          sx={{
            width: "100%",
          }}
        >
          {data.post.postType === "GIST" ? (
            <>
              <TransText
                {...(data.post.likeCount === 1
                  ? POST_INFO.post_likes_one(summarizeNum(data.post.likeCount))
                  : POST_INFO.post_likes_many(
                      summarizeNum(data.post.likeCount),
                    ))}
                sx={{
                  ...theme.typography.text2,
                  color: "inherit",
                }}
              />
              <Box
                sx={{
                  display: "inline-flex",
                  flexDirection: "row",
                  gap: theme.gap(2),
                }}
              >
                <SmartDate
                  timestamp={data.post.createdAt}
                  adaptiveTime={useAdaptiveTime}
                  suffix="ago |"
                  sx={{
                    ...theme.typography.text4,
                    color: "inherit",
                  }}
                />
                <TransText
                  {...(data.post.viewCount === 1
                    ? POST_INFO.post_views_one(
                        summarizeNum(data.post.viewCount),
                      )
                    : POST_INFO.post_views_many(
                        summarizeNum(data.post.viewCount),
                      ))}
                  trimCount={1}
                  sx={{
                    ...theme.typography.text4,
                    color: "inherit",
                    width: "100%",
                  }}
                />
              </Box>
            </>
          ) : (
            <TransText
              sx={{
                ...theme.typography.text4,
                color: "inherit",
                display: "block",
              }}
            >
              Shared trending post
            </TransText>
          )}
        </Box>
      </Box>
    </Stack>
  );
};

/**
 * Complete side landing wrapper managing title headers and core carousels.
 */
export const TrendingPosts = ({ style }: { style?: GenericStyle }) => {
  const theme = useTheme();
  const { processedPosts, isLoading } = useTrendingData();

  const carouselItems = processedPosts.map((item) => (
    <TrendingPostCard key={item.post._id} data={item} />
  ));

  return (
    <Box
      sx={{
        width: "50%",
        display: "flex",
        position: "relative",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: theme.gap(16),
        paddingBottom: theme.boxSpacing(5),
        margin: "0 auto",
        backgroundColor: theme.palette.gray[300],
        overflow: "hidden",
        ...style?.container,
        [theme.breakpoints.down("md")]: {
          width: "100%",
          height: "100svh",
          minHeight: "fit-content",
          scrollSnapAlign: "start",
          flex: "none",
          ...style?.container?.smallScreen,
        },
      }}
    >
      {isLoading ? (
        <PostSkeleton
          quantity={1}
          bgColor={theme.palette.gray.trans.overlay(0.08)}
          body={{ height: "100%" }}
          containerStyle={{
            height: "100%",
            padding: theme.boxSpacing(5, 5, 2, 5),
          }}
        />
      ) : carouselItems.length > 0 ? (
        <LinearCarousel
          items={carouselItems}
          autoPlay
          pauseOnHover
          interval={7000}
          style={{
            viewport: {
              paddingX: theme.gap(0),
              gap: theme.gap(0),
            },
          }}
        />
      ) : (
        <>
          <Quote size={50} />
          <Stack
            sx={{
              gap: theme.gap(8),
              alignItems: "center",
              padding: theme.boxSpacing(18),
            }}
          >
            <TransText
              {...COMMON_FEEDBACK.quote1}
              component="h6"
              sx={{
                ...theme.typography.h6,
                textAlign: "center",
                width: "80%",
                color: theme.palette.gray[0],
              }}
            />
            <TransText
              sx={{
                ...theme.typography.text2,
                fontWeight: "600",
                width: "100%",
                textAlign: "center",
                color: theme.palette.primary.light,
              }}
            >
              ~ Funstakes
            </TransText>
          </Stack>
        </>
      )}
    </Box>
  );
};
