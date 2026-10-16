"use client";

import { ROUTES_REGISTRY } from "@repo/core";

// Extract page title from path
export const extractPageTitle = (path: string) => {
  return path === "/" ? "Home" : path.replace(/\/$/, "").split("/").pop() || "";
};

export const matchPaths = (pathA: string, pageB: string) => {
  return (
    pathA.toLowerCase() === pageB.toLowerCase() ||
    pathA.toLowerCase().startsWith(`/${pageB.toLowerCase()}`)
  );
};

export const normalizePath = (p: string) => {
  const low = p.toLowerCase().trim();
  if (low === "/" || !low) return "/";
  return low.replace(/\/+$/, "").split("?")[0].split("#")[0];
};
/**
 * Determines the primary application zone for a given path based on the registry.
 */
const getZoneFromRegistry = (path: string): string | null => {
  const target = normalizePath(path);
  const entry = Object.entries(ROUTES_REGISTRY).find(([key, routes]) => {
    // Skip utility/grouping keys to find the actual hosting app
    if (key === "external" || key === "offline") return false;

    return routes.some((r) => normalizePath(r) === target);
  });
  return entry ? entry[0] : null;
};

/** * Determines if a navigation target requires a hard reload (Cross-Zone)
 * or if it can be handled by the current app's SPA router.
 */
export const crossZoneCheck = (path: string): boolean => {
  if (typeof window === "undefined") return false;
  const targetPath = normalizePath(path);
  const currentPath = normalizePath(window.location.pathname);

  // Exit early if paths are effectively identical
  if (targetPath === currentPath) return false;

  // Explicit Shell-to-Shell check for the Root
  const isTargetShell = ROUTES_REGISTRY.shell.some(
    (r) => normalizePath(r) === targetPath,
  );
  const isCurrentShell = ROUTES_REGISTRY.shell.some(
    (r) => normalizePath(r) === currentPath,
  );
  if (isTargetShell && isCurrentShell) return false;

  // Registry-based Zone Matching
  const targetZone = getZoneFromRegistry(targetPath);
  const currentZone = getZoneFromRegistry(currentPath);
  if (targetZone && currentZone && targetZone === currentZone) return false;

  // Segment Fallback for dynamic routes not explicitly in registry
  // Extracts the first segment: "/gist/123" -> "gist"
  const getFirstSegment = (p: string) =>
    p.split("/").filter(Boolean)[0] || "home";

  const targetSegment = getFirstSegment(targetPath);
  const currentSegment = getFirstSegment(currentPath);

  // If the first segments match, we treat them as being in the same zone/app.
  return targetSegment !== currentSegment;
};

let prefetchTimeout: NodeJS.Timeout;

export const prefetchPage = (href?: string, isCrossZone?: boolean) => {
  if (isCrossZone && href && typeof window !== "undefined") {
    if (prefetchTimeout) clearTimeout(prefetchTimeout);
    // Check if we've already prefetched this exact URL
    const alreadyPrefetched = document.querySelector(
      `link[rel="prefetch"][href="${href}"]`,
    );
    if (!alreadyPrefetched) {
      const link = document.createElement("link");
      link.rel = "prefetch";
      link.href = href;
      link.setAttribute("as", "document");
      document.head.appendChild(link);
    }
  }
};

export const debouncedPrefetch = (
  href: string,
  isCrossZone: boolean,
  delay = 1500,
) => {
  if (prefetchTimeout) clearTimeout(prefetchTimeout);
  prefetchTimeout = setTimeout(() => {
    prefetchPage(href, isCrossZone);
  }, delay);
};
