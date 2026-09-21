"use client";

import { useRef, useState, useEffect, useCallback } from "react";

/**
 * Handles programmatic element scroll drivers and state syncing for native CSS snap containers.
 */
export const useLinearCarousel = (
  length: number,
  interval = 5000,
  autoPlay = false,
  initialIndex = 0,
  setCurrentIndex?: (index: number) => void,
) => {
  const viewportRef = useRef<HTMLDivElement>(null);

  const safeInitialIndex =
    length > 0 ? Math.min(Math.max(initialIndex, 0), length - 1) : 0;

  const [currentIndex, setLocalIndex] = useState(safeInitialIndex);
  const [isPaused, setIsPaused] = useState(false);
  const isCrossZoneLoading = useRef(false);

  /**
   * Helper function to extract the true step interval (item width + layout gap).
   */
  const getScrollStep = useCallback((el: HTMLDivElement): number => {
    const firstChild = el.firstElementChild as HTMLElement;
    if (!firstChild) return el.clientWidth;

    const itemWidth = firstChild.getBoundingClientRect().width;
    const computedGap = parseFloat(window.getComputedStyle(el).gap) || 0;

    return itemWidth + computedGap;
  }, []);

  /**
   * Evaluates active horizontal viewport placements to keep state synchronized.
   */
  const handleScroll = useCallback(() => {
    const el = viewportRef.current;
    if (!el || isCrossZoneLoading.current) return;

    const step = getScrollStep(el);
    if (step <= 0) return;

    const calculatedIndex = Math.round(el.scrollLeft / step);
    if (
      calculatedIndex !== currentIndex &&
      calculatedIndex >= 0 &&
      calculatedIndex < length
    ) {
      setLocalIndex(calculatedIndex);
      setCurrentIndex?.(calculatedIndex);
    }
  }, [currentIndex, length, setCurrentIndex, getScrollStep]);

  /**
   * Smooth scrolls the container view to a specific target card index.
   */
  const goTo = useCallback(
    (targetIndex: number) => {
      const el = viewportRef.current;
      if (!el || targetIndex < 0 || targetIndex >= length) return;

      const step = getScrollStep(el);

      isCrossZoneLoading.current = true;
      setLocalIndex(targetIndex);
      setCurrentIndex?.(targetIndex);

      el.scrollTo({
        left: targetIndex * step,
        behavior: "smooth",
      });

      setTimeout(() => {
        isCrossZoneLoading.current = false;
      }, 400);
    },
    [length, setCurrentIndex, getScrollStep],
  );

  const next = useCallback(() => {
    if (currentIndex >= length - 1) return;
    goTo(currentIndex + 1);
  }, [currentIndex, length, goTo]);

  const prev = useCallback(() => {
    if (currentIndex <= 0) return;
    goTo(currentIndex - 1);
  }, [currentIndex, goTo]);

  const setPauseState = useCallback((paused: boolean) => {
    setIsPaused(paused);
  }, []);

  useEffect(() => {
    if (safeInitialIndex > 0) {
      goTo(safeInitialIndex);
    }
  }, []);

  useEffect(() => {
    if (!autoPlay || isPaused || length <= 1) return;
    const timer = setInterval(() => {
      const nextIndex = (currentIndex + 1) % length;
      goTo(nextIndex);
    }, interval);

    return () => clearInterval(timer);
  }, [autoPlay, isPaused, currentIndex, length, interval, goTo]);

  return {
    currentIndex,
    viewportRef,
    isPaused,
    next,
    prev,
    goTo,
    handleScroll,
    setPauseState,
    isFirst: currentIndex === 0,
    isLast: currentIndex === length - 1,
  };
};
