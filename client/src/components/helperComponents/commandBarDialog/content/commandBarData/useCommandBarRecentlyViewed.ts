import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { History } from "lucide-react";
import { getRecentlyViewedProblems } from "@/services/recentlyViewedProblems";
import type { CommandBarEntry } from "./commandBarTypes";

/**
 * Reads from localStorage on mount (i.e. every time the dialog opens, since
 * CommandBarDialogContent remounts with the dialog). Only meaningful
 * when the search box is empty — the caller decides whether to include
 * this group.
 */
export function useCommandBarRecentlyViewed(
  onNavigate: () => void,
): CommandBarEntry[] {
  const router = useRouter();
  const [recentlyViewed, setRecentlyViewed] = useState<
    ReturnType<typeof getRecentlyViewedProblems>
  >([]);

  useEffect(() => {
    setRecentlyViewed(getRecentlyViewedProblems());
  }, []);

  return useMemo(
    () =>
      recentlyViewed.map(
        (problem): CommandBarEntry => ({
          id: `recent-${problem.title}`,
          title: problem.title,
          subtitle: "Recently viewed",
          icon: History,
          kind: "recent",
          difficulty: problem.difficulty,
          onSelect: () => {
            router.push(
              `/problems/problem-detail?title=${encodeURIComponent(problem.title)}`,
            );
            onNavigate();
          },
        }),
      ),
    [recentlyViewed, router, onNavigate],
  );
}
