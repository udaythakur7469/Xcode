"use client";

import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { topicTags } from "@/components/landingPage/landingPageData/data";
import { useUserStore } from "@/features/userStore";
import {
  useProblemNavStore,
  type ProblemDifficulty,
  type ProblemStatusFilter,
} from "@/features/problemNavStore";
import type { ProblemListLayout } from "./problemListLayout";

const SEARCH_DEBOUNCE_MS = 300;

const DIFFICULTIES: { value: ProblemDifficulty; label: string; text: string }[] =
  [
    { value: "easy", label: "Easy", text: "text-green-500" },
    { value: "medium", label: "Medium", text: "text-yellow-500" },
    { value: "hard", label: "Hard", text: "text-red-500" },
  ];

const STATUS_OPTIONS: { value: ProblemStatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "solved", label: "Solved" },
  { value: "attempted", label: "Attempted" },
  { value: "unsolved", label: "Unsolved" },
];

const chipClass = (selected: boolean) =>
  cn(
    "rounded-full border px-3 py-1 text-[13px] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
    selected
      ? "border-green-600 bg-green-600 font-semibold text-white"
      : "bg-secondary hover:bg-secondary/70",
  );

interface ProblemListToolbarProps {
  layout: ProblemListLayout;
  filtersOpen: boolean;
  onFiltersOpenChange: (open: boolean) => void;
  searchInputRef: React.RefObject<HTMLInputElement>;
  // Opens the login dialog (guests clicking the locked Status filter).
  onRequestLogin: () => void;
  // While a login/signup dialog is up, clicks inside it must not count as
  // "outside" clicks that would close the filters popover underneath.
  isAuthDialogOpen: boolean;
}

const ProblemListToolbar: React.FC<ProblemListToolbarProps> = ({
  layout,
  filtersOpen,
  onFiltersOpenChange,
  searchInputRef,
  onRequestLogin,
  isAuthDialogOpen,
}) => {
  const isAuthenticated = useUserStore((s) => s.isUserAuthenticated);
  const {
    query,
    status,
    difficulties,
    tags,
    setQuery,
    setStatus,
    toggleDifficulty,
    toggleTag,
    resetFilters,
  } = useProblemNavStore();

  const popoverRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Guests can't use the Status filter, so it never counts as active for them.
  const effectiveStatus: ProblemStatusFilter = isAuthenticated ? status : "all";
  const activeFilterCount =
    (effectiveStatus !== "all" ? 1 : 0) + difficulties.length + tags.length;
  const canReset = activeFilterCount > 0 || query !== "";

  // ── Debounced search ────────────────────────────────────────────────
  // The input is driven by local state so typing never waits on the
  // store; the store (and therefore the network) only hears about it
  // once typing pauses. pushedRef remembers the last value we sent so a
  // store change that did NOT come from typing (Reset all, restored
  // sessionStorage) is copied back into the input without ever
  // overwriting what the user is in the middle of typing.
  const [searchValue, setSearchValue] = useState(query);
  const pushedRef = useRef(query);

  useEffect(() => {
    if (query !== pushedRef.current) {
      pushedRef.current = query;
      setSearchValue(query);
    }
  }, [query]);

  useEffect(() => {
    if (searchValue === pushedRef.current) return;
    const timeout = setTimeout(() => {
      pushedRef.current = searchValue;
      setQuery(searchValue);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [searchValue, setQuery]);

  // ── Close the popover on outside click ─────────────────────────────
  useEffect(() => {
    if (!filtersOpen || isAuthDialogOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (
        popoverRef.current?.contains(target) ||
        triggerRef.current?.contains(target)
      ) {
        return;
      }
      onFiltersOpenChange(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [filtersOpen, isAuthDialogOpen, onFiltersOpenChange]);

  const clearSearch = () => {
    pushedRef.current = "";
    setSearchValue("");
    setQuery("");
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      // Hand focus to the list (current problem if loaded, else first row).
      const panel = e.currentTarget.closest("[data-problem-panel]");
      const row =
        panel?.querySelector<HTMLElement>('[data-problem-row][tabindex="0"]') ??
        panel?.querySelector<HTMLElement>("[data-problem-row]");
      if (row) {
        e.preventDefault();
        row.focus();
      }
    } else if (e.key === "Escape" && searchValue) {
      // First Esc clears the text; the panel only closes on the next one.
      e.preventDefault();
      clearSearch();
    }
  };

  const statusSegment = (
    <div
      role="radiogroup"
      aria-label="Status"
      className="inline-flex max-w-full overflow-hidden rounded-md border"
    >
      {STATUS_OPTIONS.map((option) => {
        const locked = !isAuthenticated && option.value !== "all";
        const selected = effectiveStatus === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-disabled={locked}
            // Locked options stay clickable on purpose (not `disabled`):
            // clicking one is how a guest gets to the login dialog.
            onClick={() =>
              locked ? onRequestLogin() : setStatus(option.value)
            }
            className={cn(
              "whitespace-nowrap px-2.5 py-1.5 text-[13px] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
              selected
                ? "bg-green-600 font-semibold text-white"
                : "hover:bg-secondary",
              locked && "cursor-not-allowed opacity-50 hover:bg-transparent",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="relative flex-none border-b p-3">
      <div className="flex items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Input
            ref={searchInputRef}
            type="search"
            data-problem-search=""
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search by title"
            aria-label="Search problems by title"
            autoComplete="off"
            className="w-full border border-white pr-9 outline-none ring-0 shadow-none focus:border-white focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:border-white focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-cancel-button]:appearance-none"
          />
          {searchValue && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => {
                clearSearch();
                searchInputRef.current?.focus();
              }}
              className="absolute right-1.5 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
        <Button
          ref={triggerRef}
          type="button"
          variant="secondary"
          aria-label="Filters"
          aria-haspopup="true"
          aria-expanded={filtersOpen}
          aria-controls="problem-list-filters"
          onClick={() => onFiltersOpenChange(!filtersOpen)}
          className="flex-none px-3"
        >
          <SlidersHorizontal />
          {layout !== "compact" && <span>Filters</span>}
          {activeFilterCount > 0 && (
            <span className="rounded-full bg-green-600 px-1.5 text-[11px] font-bold leading-4 text-white">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </div>

      <AnimatePresence>
        {filtersOpen && (
          <motion.div
            key="filters"
            ref={popoverRef}
            id="problem-list-filters"
            role="group"
            aria-label="Filters"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            style={{ transformOrigin: "top center" }}
            className="absolute inset-x-3 top-full z-20 mt-1 grid max-h-[calc(100vh-160px)] gap-4 overflow-y-auto rounded-xl border bg-popover p-4 text-popover-foreground shadow-2xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold">Filters</span>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={!canReset}
                  onClick={resetFilters}
                >
                  Reset all
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  aria-label="Close filters"
                  onClick={() => {
                    onFiltersOpenChange(false);
                    triggerRef.current?.focus();
                  }}
                >
                  <X />
                </Button>
              </div>
            </div>

            <section>
              <h4 className="mb-1.5 text-xs font-semibold text-muted-foreground">
                Status
              </h4>
              {isAuthenticated ? (
                statusSegment
              ) : (
                <HoverCard openDelay={250}>
                  <HoverCardTrigger asChild>
                    <div className="inline-block max-w-full">
                      {statusSegment}
                    </div>
                  </HoverCardTrigger>
                  <HoverCardContent
                    align="start"
                    className="px-2.5 py-1.5 text-xs"
                  >
                    Log in to filter by status
                  </HoverCardContent>
                </HoverCard>
              )}
            </section>

            <section>
              <h4 className="mb-1.5 text-xs font-semibold text-muted-foreground">
                Difficulty
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {DIFFICULTIES.map((difficulty) => {
                  const selected = difficulties.includes(difficulty.value);
                  return (
                    <button
                      key={difficulty.value}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => toggleDifficulty(difficulty.value)}
                      className={cn(
                        chipClass(selected),
                        !selected && difficulty.text,
                      )}
                    >
                      {difficulty.label}
                    </button>
                  );
                })}
              </div>
            </section>

            <section>
              <h4 className="mb-1.5 text-xs font-semibold text-muted-foreground">
                Topics
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {topicTags.map((tag) => {
                  const selected = tags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => toggleTag(tag)}
                      className={chipClass(selected)}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </section>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProblemListToolbar;
