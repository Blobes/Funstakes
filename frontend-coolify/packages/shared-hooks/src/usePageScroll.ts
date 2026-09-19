"use client";

import { useEffect, useState, useRef } from "react";
import { useIntersectionObserver } from "./useObserver";

/**
 * Tracks scroll direction on a target element or window.
 * Uses a threshold and rAF-throttling to prevent main-thread blocking.
 */
export const usePageScroll = (ref?: React.RefObject<HTMLElement | null>) => {
  const [scrollDir, setScrollDir] = useState<"up" | "down">("up");
  const prevOffset = useRef(0);
  const ticking = useRef(false);
  const scrollDirRef = useRef(scrollDir);

  useEffect(() => {
    scrollDirRef.current = scrollDir;
  }, [scrollDir]);

  useEffect(() => {
    const scrollTarget = ref?.current || window;

    const updateScrollDir = () => {
      const currentOffset =
        scrollTarget instanceof Window
          ? window.scrollY
          : scrollTarget.scrollTop;

      const diff = currentOffset - prevOffset.current;

      if (Math.abs(diff) > 16) {
        const newDir = diff > 0 ? "down" : "up";
        if (newDir !== scrollDirRef.current) {
          setScrollDir(newDir);
        }
        prevOffset.current = currentOffset <= 0 ? 0 : currentOffset;
      }
      ticking.current = false;
    };

    const onScroll = () => {
      if (!ticking.current) {
        window.requestAnimationFrame(updateScrollDir);
        ticking.current = true;
      }
    };
    scrollTarget.addEventListener("scroll", onScroll, { passive: true });
    return () => scrollTarget.removeEventListener("scroll", onScroll);
  }, [ref]);

  return { scrollDir };
};

interface InfiniteScrollOptions {
  hasNextPage: boolean | undefined;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
}
/**
 * Triggers fetchNextPage when the sentinel enters the viewport.
 */
export const useInfiniteScroll = ({
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
}: InfiniteScrollOptions) => {
  const { elementRef } = useIntersectionObserver({
    onIntersect: fetchNextPage,
    threshold: 0.1,
    rootMargin: "200px",
    enabled: !!hasNextPage && !isFetchingNextPage,
    once: false, // Keep observing for subsequent pages
  });

  return { sentinelRef: elementRef };
};
