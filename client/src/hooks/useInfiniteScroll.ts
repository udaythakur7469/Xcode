"use client";

import { useEffect, useRef, useCallback } from "react";

/**
 * Wires an IntersectionObserver to a sentinel div and calls `onLoadMore`
 * whenever it scrolls into view (and `hasMore` is true). Shared by
 * ContestsList and ContestLeaderboard, which both paginate this way.
 * Attach the returned ref to a div placed at the end of the list.
 */
export function useInfiniteScroll(hasMore: boolean, onLoadMore: () => void) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const load = useCallback(() => {
    if (hasMore) onLoadMore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore, onLoadMore]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => entries[0].isIntersecting && load(),
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [load]);

  return sentinelRef;
}
