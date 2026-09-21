"use client";

import { useEffect, useRef, useState } from "react";

const FALLBACK_DELAY_MS = 3 * 1000; // 3 seconds

/**
 * Returns true once `isLoading` has been true continuously for at least
 * `delayMs`, signaling that it's acceptable to fall back to cached data
 * instead of waiting further on the live fetch. Resets whenever loading
 * starts fresh.
 */
export const useLoadingFallback = (
  isLoading: boolean,
  delayMs = FALLBACK_DELAY_MS,
) => {
  const [canFallback, setCanFallback] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isLoading) {
      setCanFallback(false);
      timerRef.current = setTimeout(() => setCanFallback(true), delayMs);
    } else {
      // Loading finished before the timer fired — no need to fall back.
      if (timerRef.current) clearTimeout(timerRef.current);
      setCanFallback(false);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isLoading, delayMs]);

  return canFallback;
};
