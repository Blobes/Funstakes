"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useIntersectionObserver } from "./useObserver";
import { ScrollRefType } from "@repo/core";

export interface UsePageScrollOptions {
  ref?: ScrollRefType;
  trackPageBottom?: boolean;
  bottomThresholdPx?: number;
  trackSelector?: string | null;
  selectorRootMargin?: string;
}

const resolveScrollElement = (ref?: ScrollRefType): Window | HTMLElement => {
  if (ref?.current && !(ref.current instanceof Window)) {
    return ref.current;
  }
  if (typeof document !== "undefined") {
    const root = document.querySelector(
      "[data-app-scroll-root='true']",
    ) as HTMLElement | null;
    if (root) return root;
  }
  return window;
};

/**
 * Tracks scroll direction and optional “near bottom” / selector visibility.
 */
export const usePageScroll = (options: UsePageScrollOptions = {}) => {
  const {
    ref,
    trackPageBottom = false,
    bottomThresholdPx = 160,
    trackSelector = null,
    selectorRootMargin = "0px",
  } = options;

  const [scrollDir, setScrollDir] = useState<"up" | "down">("up");
  const [isNearPageBottom, setIsNearPageBottom] = useState(false);
  const [isSelectorVisible, setIsSelectorVisible] = useState(false);

  const prevOffset = useRef(0);
  const ticking = useRef(false);
  const scrollDirRef = useRef(scrollDir);

  useEffect(() => {
    scrollDirRef.current = scrollDir;
  }, [scrollDir]);

  const measurePageBottom = useCallback(() => {
    if (!trackPageBottom) {
      setIsNearPageBottom(false);
      return;
    }

    const target = resolveScrollElement(ref);

    if (!(target instanceof Window)) {
      const el = target;
      const canScroll = el.scrollHeight > el.clientHeight + bottomThresholdPx;
      const near =
        canScroll &&
        el.scrollTop + el.clientHeight >= el.scrollHeight - bottomThresholdPx;
      setIsNearPageBottom(near);
      return;
    }

    const doc = document.documentElement;
    const scrollHeight = Math.max(doc.scrollHeight, document.body.scrollHeight);
    const scrollBottom = window.scrollY + window.innerHeight;
    const canScroll = scrollHeight > window.innerHeight + bottomThresholdPx;
    const near = canScroll && scrollBottom >= scrollHeight - bottomThresholdPx;
    setIsNearPageBottom(near);
  }, [ref, trackPageBottom, bottomThresholdPx]);

  // Direction + page-bottom; re-bind when scroll root appears
  useEffect(() => {
    let attached: Window | HTMLElement | null = null;
    let cancelled = false;

    const updateScrollDir = () => {
      const target = attached ?? resolveScrollElement(ref);
      const currentOffset =
        target instanceof Window ? window.scrollY : target.scrollTop;

      const diff = currentOffset - prevOffset.current;
      if (Math.abs(diff) > 16) {
        const newDir = diff > 0 ? "down" : "up";
        if (newDir !== scrollDirRef.current) {
          setScrollDir(newDir);
        }
        prevOffset.current = currentOffset <= 0 ? 0 : currentOffset;
      }

      measurePageBottom();
      ticking.current = false;
    };

    const onScroll = () => {
      if (!ticking.current) {
        window.requestAnimationFrame(updateScrollDir);
        ticking.current = true;
      }
    };

    const bind = () => {
      if (cancelled) return;
      const next = resolveScrollElement(ref);
      if (attached === next) return;

      attached?.removeEventListener("scroll", onScroll);
      attached = next;
      measurePageBottom();
      attached.addEventListener("scroll", onScroll, { passive: true });
    };

    bind();

    // ref / data-app-scroll-root may mount after first paint
    const pollId = window.setInterval(bind, 50);
    const stopPollId = window.setTimeout(() => {
      window.clearInterval(pollId);
    }, 2000);

    window.addEventListener("resize", measurePageBottom, { passive: true });

    return () => {
      cancelled = true;
      window.clearInterval(pollId);
      window.clearTimeout(stopPollId);
      attached?.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", measurePageBottom);
    };
  }, [ref, measurePageBottom]);

  // Optional: element visibility via IntersectionObserver
  useEffect(() => {
    if (!trackSelector) {
      setIsSelectorVisible(false);
      return;
    }

    const node = document.querySelector(trackSelector);
    if (!node) {
      setIsSelectorVisible(false);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setIsSelectorVisible(entry.isIntersecting),
      { threshold: 0, rootMargin: selectorRootMargin },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [trackSelector, selectorRootMargin]);

  return {
    scrollDir,
    isNearPageBottom,
    isSelectorVisible,
  };
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
    once: false,
  });
  return { sentinelRef: elementRef };
};
