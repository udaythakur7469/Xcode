"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  PROBLEM_LIST_PAGE_SIZE,
  useProblemNavStore,
  type ProblemListItem,
} from "@/features/problemNavStore";
import { useUserStore } from "@/features/userStore";
import { getProblemDetailUrl } from "@/hooks/useAdjacentProblems";
import { ProblemListRow, ProblemListRowSkeleton } from "./ProblemListRow";
import type { ProblemListLayout } from "./problemListLayout";

// Same idea as the Discussion tab's infinite scroll: fetch the next page
// when the user is this close to the bottom.
const SCROLL_THRESHOLD = 160;
const LOAD_MORE_SKELETON_ROWS = 4;
// How many rows PageUp / PageDown jump.
const PAGE_JUMP = 8;
// How long the solved/attempted icons "pop in" after logging in.
const REVEAL_DURATION_MS = 1500;

interface ProblemListBodyProps {
  layout: ProblemListLayout;
  onClose: () => void;
}

const ProblemListBody: React.FC<ProblemListBodyProps> = ({
  layout,
  onClose,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTitle = searchParams.get("title");

  const isAuthenticated = useUserStore((s) => s.isUserAuthenticated);
  const {
    items,
    hasNextPage,
    total,
    hasLoaded,
    isLoading,
    isRefreshing,
    isFetchingMore,
    error,
    loadFirstPage,
    refresh,
    loadMore,
    retry,
  } = useProblemNavStore();

  const scrollRef = useRef<HTMLDivElement>(null);
  const [anchorId, setAnchorId] = useState<number | null>(null);
  const [revealStatus, setRevealStatus] = useState(false);

  // ── Initial load / refresh on open ─────────────────────────────────
  // First ever open: load with skeletons. Any later open: the rows from
  // last time are still in the store, so show them straight away and
  // silently refresh them (a submission may have changed solved status).
  useEffect(() => {
    if (useProblemNavStore.getState().hasLoaded) {
      void refresh();
    } else {
      void loadFirstPage();
    }
    // Runs once per open (this component mounts when the sidebar opens).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Login / logout while the sidebar is open ──────────────────────
  // Re-fetch exactly what is on screen and swap it in place: the panel,
  // filters, search text and scroll position all stay as they are, and
  // the status column / solved filter simply start (or stop) showing.
  const previousAuthRef = useRef(isAuthenticated);
  useEffect(() => {
    if (previousAuthRef.current === isAuthenticated) return;
    previousAuthRef.current = isAuthenticated;
    void refresh();
    if (!isAuthenticated) {
      setRevealStatus(false);
      return;
    }
    setRevealStatus(true);
    const timeout = setTimeout(() => setRevealStatus(false), REVEAL_DURATION_MS);
    return () => clearTimeout(timeout);
  }, [isAuthenticated, refresh]);

  // ── Back online after a failed request ────────────────────────────
  useEffect(() => {
    if (!error) return;
    const onOnline = () => void retry();
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [error, retry]);

  // ── Infinite scroll (same pattern as the Discussion tab) ─────────
  const loadMoreRef = useRef(loadMore);
  loadMoreRef.current = loadMore;

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const onScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      if (scrollHeight - scrollTop - clientHeight < SCROLL_THRESHOLD) {
        loadMoreRef.current();
      }
    };
    container.addEventListener("scroll", onScroll, { passive: true });
    return () => container.removeEventListener("scroll", onScroll);
  }, []);

  // If the rows don't fill the panel there is nothing to scroll, so the
  // scroll listener would never fire - keep pulling pages until they do
  // (loadMore itself ignores the call when there is nothing to load).
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    if (container.scrollHeight <= container.clientHeight + 1) {
      loadMoreRef.current();
    }
  }, [items.length, hasNextPage, isLoading, isRefreshing, isFetchingMore, error]);

  // ── Scroll the current problem into view (once per open) ──────────
  // Only possible when it is already among the loaded rows; fetching
  // "around" an id isn't worth a dedicated endpoint for this feature.
  const hasCenteredRef = useRef(false);
  useEffect(() => {
    if (hasCenteredRef.current || isLoading || items.length === 0) return;
    hasCenteredRef.current = true;
    const container = scrollRef.current;
    const row = container?.querySelector<HTMLElement>(
      '[data-current-problem="true"]',
    );
    if (container && row) {
      container.scrollTop = Math.max(
        0,
        row.offsetTop - container.clientHeight / 2 + row.offsetHeight / 2,
      );
    }
  }, [items, isLoading]);

  // ── Selecting a problem ────────────────────────────────────────────
  const handleSelect = useCallback(
    (item: ProblemListItem) => {
      if (item.title !== currentTitle) {
        router.push(getProblemDetailUrl(item.title));
      }
      onClose();
    },
    [currentTitle, router, onClose],
  );

  const handleRowFocus = useCallback(
    (item: ProblemListItem) => setAnchorId(item.id),
    [],
  );

  // Roving tabindex: the row that last had focus (or the current problem,
  // or the first row) is the single tab stop for the whole list.
  const currentItem = items.find((item) => item.title === currentTitle);
  const effectiveAnchorId = items.some((item) => item.id === anchorId)
    ? anchorId
    : (currentItem?.id ?? items[0]?.id ?? null);

  // ── Keyboard: ↑ ↓ Home End PageUp PageDown Enter Space ────────────
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const rowEl = (e.target as HTMLElement).closest<HTMLElement>(
      "[data-problem-row]",
    );
    const container = scrollRef.current;
    if (!rowEl || !container) return;

    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const item = items.find(
        (candidate) => String(candidate.id) === rowEl.dataset.problemId,
      );
      if (item) handleSelect(item);
      return;
    }

    const rows = Array.from(
      container.querySelectorAll<HTMLElement>("[data-problem-row]"),
    );
    const index = rows.indexOf(rowEl);
    let target: number;
    switch (e.key) {
      case "ArrowDown":
        target = index + 1;
        break;
      case "ArrowUp":
        target = index - 1;
        break;
      case "PageDown":
        target = index + PAGE_JUMP;
        break;
      case "PageUp":
        target = index - PAGE_JUMP;
        break;
      case "Home":
        target = 0;
        break;
      case "End":
        target = rows.length - 1;
        break;
      default:
        return;
    }
    e.preventDefault();

    // Up from the first row goes back to the search box.
    if (target < 0 && e.key === "ArrowUp") {
      rowEl
        .closest("[data-problem-panel]")
        ?.querySelector<HTMLInputElement>("[data-problem-search]")
        ?.focus();
      return;
    }

    target = Math.min(Math.max(target, 0), rows.length - 1);
    rows[target]?.focus();
    // Close to the end of what is loaded: start fetching the next page.
    if (rows.length - 1 - target < 3) loadMore();
  };

  // ── What to render ─────────────────────────────────────────────────
  const hasFailedInitialLoad = !!error && items.length === 0 && !isLoading;
  const isEmpty = hasLoaded && !isLoading && !error && items.length === 0;

  const resultText = hasFailedInitialLoad
    ? "Couldn't load problems"
    : isLoading
      ? hasLoaded
        ? "Searching…"
        : "Loading…"
      : total === null
        ? ""
        : total === 0
          ? "No problems found"
          : `Showing ${items.length} of ${total} problems`;

  const skeletonRows = (count: number) =>
    Array.from({ length: count }, (_, index) => (
      <ProblemListRowSkeleton
        key={index}
        index={index}
        layout={layout}
        showStatus={isAuthenticated}
      />
    ));

  return (
    <>
      <div
        role="status"
        aria-live="polite"
        className="flex h-7 flex-none items-center border-b px-3.5 text-xs text-muted-foreground"
      >
        {resultText}
      </div>

      <div
        ref={scrollRef}
        data-problem-list=""
        aria-busy={isLoading || isRefreshing}
        onKeyDown={handleKeyDown}
        className="relative min-h-0 flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {isLoading ? (
          skeletonRows(PROBLEM_LIST_PAGE_SIZE)
        ) : hasFailedInitialLoad ? (
          <div className="flex flex-col items-center gap-3 px-6 py-10 text-center text-sm text-muted-foreground">
            <p>Couldn&apos;t load problems.</p>
            <Button variant="secondary" size="sm" onClick={() => void retry()}>
              Retry
            </Button>
          </div>
        ) : isEmpty ? (
          <div className="px-6 py-10 text-center text-sm text-muted-foreground">
            No problems match these filters.
          </div>
        ) : (
          <>
            <div role="listbox" aria-label="Problems">
              {items.map((item) => (
                <ProblemListRow
                  key={item.id}
                  item={item}
                  layout={layout}
                  isCurrent={item.title === currentTitle}
                  showStatus={isAuthenticated}
                  revealStatus={revealStatus}
                  tabIndex={item.id === effectiveAnchorId ? 0 : -1}
                  onSelect={handleSelect}
                  onFocus={handleRowFocus}
                />
              ))}
            </div>

            {error ? (
              <div className="flex flex-col items-center gap-3 px-6 py-6 text-center text-sm text-muted-foreground">
                <p>Couldn&apos;t load more problems.</p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => void retry()}
                >
                  Retry
                </Button>
              </div>
            ) : isFetchingMore ? (
              skeletonRows(LOAD_MORE_SKELETON_ROWS)
            ) : !hasNextPage ? (
              <div className="px-6 py-5 text-center text-xs text-muted-foreground">
                You&apos;ve reached the end
              </div>
            ) : null}
          </>
        )}
      </div>
    </>
  );
};

export default ProblemListBody;
