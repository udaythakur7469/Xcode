import { useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { House, ListChecks, MessagesSquare } from "lucide-react";
import type { CommandBarEntry } from "./commandBarTypes";

/**
 * The four static navigation rows. Behavior is unchanged from the original
 * CommandBarData.tsx: each link hides itself when the user is already
 * on that page, so the Bar never suggests navigating somewhere you
 * already are.
 */
export function useCommandBarNavItems(
  onNavigate: () => void,
): CommandBarEntry[] {
  const router = useRouter();
  const pathname = usePathname();

  return useMemo(() => {
    const entries: CommandBarEntry[] = [];

    if (pathname !== "/") {
      entries.push({
        id: "nav-home",
        title: "Home",
        subtitle: "/home",
        icon: House,
        kind: "navigation",
        onSelect: () => {
          router.push("/");
          onNavigate();
        },
      });
    }

    if (pathname !== "/problems") {
      entries.push({
        id: "nav-problems",
        title: "Problems",
        subtitle: "/problems",
        icon: ListChecks,
        kind: "navigation",
        onSelect: () => {
          router.push("/problems");
          onNavigate();
        },
      });
    }

    if (pathname !== "/interview") {
      entries.push({
        id: "nav-interviews",
        title: "Interviews",
        subtitle: "/interview",
        icon: MessagesSquare,
        kind: "navigation",
        onSelect: () => {
          router.push("/interview");
          onNavigate();
        },
      });
    }

    return entries;
  }, [pathname, router, onNavigate]);
}
