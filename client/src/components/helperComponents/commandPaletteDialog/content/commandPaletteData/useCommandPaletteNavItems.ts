import { useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { House, ListChecks, MessagesSquare, Trophy } from "lucide-react";
import type { CommandPaletteEntry } from "./commandPaletteTypes";

/**
 * The four static navigation rows. Behavior is unchanged from the original
 * CommandPaletteData.tsx: each link hides itself when the user is already
 * on that page, so the palette never suggests navigating somewhere you
 * already are.
 */
export function useCommandPaletteNavItems(
  onNavigate: () => void,
): CommandPaletteEntry[] {
  const router = useRouter();
  const pathname = usePathname();

  return useMemo(() => {
    const entries: CommandPaletteEntry[] = [];

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

    if (pathname !== "/contests") {
      entries.push({
        id: "nav-contests",
        title: "Contests",
        subtitle: "/contests",
        icon: Trophy,
        kind: "navigation",
        onSelect: () => {
          router.push("/contests");
          onNavigate();
        },
      });
    }

    return entries;
  }, [pathname, router, onNavigate]);
}
