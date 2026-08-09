import { useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { BookOpenCheck } from "lucide-react";
import { useProblemStore } from "@/features/problemStore";
import type { CommandPaletteEntry } from "./commandPaletteTypes";

const SEARCH_DEBOUNCE_MS = 250;
const MAX_RESULTS = 8;

/**
 * Live-searches the real problems table (same /problem/searchProblems
 * endpoint and searchResults slice the Problems page search bar uses), so
 * newly added or removed problems show up automatically — the palette
 * never has its own stale copy of the problem list.
 */
export function useCommandPaletteProblemSearch(
  searchQuery: string,
  onNavigate: () => void,
): CommandPaletteEntry[] {
  const router = useRouter();
  const { searchResults, searchProblems } = useProblemStore();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!searchQuery.trim()) {
      return;
    }

    debounceRef.current = setTimeout(() => {
      searchProblems(searchQuery);
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery, searchProblems]);

  return useMemo(() => {
    if (!searchQuery.trim()) return [];

    return searchResults.slice(0, MAX_RESULTS).map(
      (problem): CommandPaletteEntry => ({
        id: `problem-${problem.title}`,
        title: problem.title,
        subtitle: `${problem.difficulty[0].toUpperCase()}${problem.difficulty.slice(1)} problem`,
        icon: BookOpenCheck,
        kind: "problem",
        difficulty: problem.difficulty,
        onSelect: () => {
          router.push(
            `/problems/problem-detail?title=${encodeURIComponent(problem.title)}`,
          );
          onNavigate();
        },
      }),
    );
  }, [searchQuery, searchResults, router, onNavigate]);
}
