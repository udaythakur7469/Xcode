import { useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { Dices, Sparkles, CalendarDays, SunMoon, Link2 } from "lucide-react";
import { useProblemStore } from "@/features/problemStore";
import { useCalendarStore } from "@/features/calenderStore";
import type { CommandBarEntry } from "./commandBarTypes";

type CommandBarQuickActionsOptions = {
  onNavigate: () => void;
  onOpenAIChat: () => void;
};

/**
 * Random Problem calls the dedicated GET /problem/randomProblem endpoint,
 * which picks uniformly at random across every problem in the DB (not just
 * whatever page happens to be loaded client-side) via a random OFFSET over
 * a COUNT query.
 */
export function useCommandBarQuickActions({
  onNavigate,
  onOpenAIChat,
}: CommandBarQuickActionsOptions): CommandBarEntry[] {
  const router = useRouter();
  const { setTheme, resolvedTheme } = useTheme();
  const { getRandomProblem } = useProblemStore();
  const { potd, fetchPotd } = useCalendarStore();

  const handleRandomProblem = useCallback(async () => {
    try {
      const randomProblem = await getRandomProblem();
      router.push(
        `/problems/problem-detail?title=${encodeURIComponent(randomProblem.title)}`,
      );
      onNavigate();
    } catch {
      toast.error("Couldn't fetch a random problem — try again.");
    }
  }, [getRandomProblem, router, onNavigate]);

  const handleDailyChallenge = useCallback(async () => {
    let dailyProblem = potd;
    if (!dailyProblem) {
      await fetchPotd();
      dailyProblem = useCalendarStore.getState().potd;
    }
    if (!dailyProblem) {
      toast.error("Today's challenge isn't available right now.");
      return;
    }
    router.push(
      `/problems/problem-detail?title=${encodeURIComponent(dailyProblem.title)}&tab=description`,
    );
    onNavigate();
  }, [potd, fetchPotd, router, onNavigate]);

  const handleCopyPageLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Page link copied to clipboard");
    } catch {
      toast.error("Couldn't copy the link — copy it from the address bar.");
    }
    onNavigate();
  }, [onNavigate]);

  const handleToggleTheme = useCallback(() => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
    onNavigate();
  }, [setTheme, resolvedTheme, onNavigate]);

  const handleOpenAIChat = useCallback(() => {
    onOpenAIChat();
    onNavigate();
  }, [onOpenAIChat, onNavigate]);

  return useMemo(
    () => [
      {
        id: "quick-random-problem",
        title: "Random Problem",
        subtitle: "Jump to a random problem",
        icon: Dices,
        kind: "quick",
        onSelect: handleRandomProblem,
      },
      {
        id: "quick-ask-nova",
        title: "Ask Nova AI",
        subtitle: "Open AI chat assistant",
        icon: Sparkles,
        kind: "quick",
        onSelect: handleOpenAIChat,
      },
      {
        id: "quick-daily-challenge",
        title: "Daily Challenge",
        subtitle: "Today's featured problem",
        icon: CalendarDays,
        kind: "quick",
        onSelect: handleDailyChallenge,
      },
      {
        id: "quick-toggle-theme",
        title: "Toggle Theme",
        subtitle: "Switch light / dark mode",
        icon: SunMoon,
        kind: "quick",
        onSelect: handleToggleTheme,
      },
      {
        id: "quick-copy-link",
        title: "Copy Page Link",
        subtitle: "Copy current URL to clipboard",
        icon: Link2,
        kind: "quick",
        onSelect: handleCopyPageLink,
      },
    ],
    [
      handleRandomProblem,
      handleOpenAIChat,
      handleDailyChallenge,
      handleToggleTheme,
      handleCopyPageLink,
    ],
  );
}
