"use client";

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/features/userStore";
import type { CommandPaletteGroup } from "./commandPaletteData/commandPaletteTypes";
import { useCommandPaletteNavItems } from "./commandPaletteData/useCommandPaletteNavItems";
import { useCommandPaletteAuthItems } from "./commandPaletteData/useCommandPaletteAuthItems";
import { useCommandPaletteQuickActions } from "./commandPaletteData/useCommandPaletteQuickActions";
import { useCommandPaletteProblemSearch } from "./commandPaletteData/useCommandPaletteProblemSearch";
import { useCommandPaletteRecentlyViewed } from "./commandPaletteData/useCommandPaletteRecentlyViewed";
import { useCommandPaletteKeyboardNav } from "./useCommandPaletteKeyboardNav";
import CommandPaletteSection from "./commandPaletteSection/CommandPaletteSection";
import CommandPaletteEmptyState from "./commandPaletteSection/CommandPaletteEmptyState";

type CommandPaletteDialogContentProps = {
  onClose: () => void;
  onOpenLogin: () => void;
  onOpenSignup: () => void;
  onOpenLogout: () => void;
  onOpenAIChat: () => void;
  searchQuery?: string;
};

function matchesSearch(searchQuery: string, title: string, subtitle: string) {
  const query = searchQuery.toLowerCase().trim();
  if (!query) return true;
  return (
    title.toLowerCase().includes(query) || subtitle.toLowerCase().includes(query)
  );
}

const CommandPaletteDialogContent: React.FC<CommandPaletteDialogContentProps> = ({
  onClose,
  onOpenLogin,
  onOpenSignup,
  onOpenLogout,
  onOpenAIChat,
  searchQuery = "",
}) => {
  const router = useRouter();
  const { userData } = useUserStore();

  const navItems = useCommandPaletteNavItems(onClose);

  const authItems = useCommandPaletteAuthItems({
    onNavigateToAccount: () => {
      const accountLink = userData?.name
        ? `/account/${userData.name}`
        : "/account";
      router.push(accountLink);
      onClose();
    },
    onOpenLogin: () => {
      onClose();
      onOpenLogin();
    },
    onOpenSignup: () => {
      onClose();
      onOpenSignup();
    },
    onOpenLogout: () => {
      onClose();
      onOpenLogout();
    },
  });

  const quickActionItems = useCommandPaletteQuickActions({
    onNavigate: onClose,
    onOpenAIChat: () => {
      onClose();
      onOpenAIChat();
    },
  });

  const problemResults = useCommandPaletteProblemSearch(searchQuery, onClose);
  const recentlyViewedItems = useCommandPaletteRecentlyViewed(onClose);

  const isSearching = searchQuery.trim().length > 0;

  const groups: CommandPaletteGroup[] = useMemo(() => {
    const filteredNav = navItems.filter((e) =>
      matchesSearch(searchQuery, e.title, e.subtitle),
    );
    const filteredAuth = authItems.filter((e) =>
      matchesSearch(searchQuery, e.title, e.subtitle),
    );
    const filteredQuick = quickActionItems.filter((e) =>
      matchesSearch(searchQuery, e.title, e.subtitle),
    );

    const result: CommandPaletteGroup[] = [
      { label: "Navigate", items: filteredNav },
      { label: "Account", items: filteredAuth },
      { label: "Quick Actions", items: filteredQuick },
    ];

    if (isSearching) {
      result.push({
        label: `Problems matching "${searchQuery}"`,
        items: problemResults,
      });
    } else {
      result.push({ label: "Recently Viewed", items: recentlyViewedItems });
    }

    return result.filter((group) => group.items.length > 0);
  }, [
    navItems,
    authItems,
    quickActionItems,
    problemResults,
    recentlyViewedItems,
    isSearching,
    searchQuery,
  ]);

  const flatEntries = useMemo(() => groups.flatMap((g) => g.items), [groups]);
  const { selectedIndex, setSelectedIndex } =
    useCommandPaletteKeyboardNav(flatEntries);

  if (flatEntries.length === 0) {
    return <CommandPaletteEmptyState searchQuery={searchQuery} />;
  }

  let runningIndex = 0;

  return (
    <div>
      {groups.map((group) => {
        const startIndex = runningIndex;
        runningIndex += group.items.length;
        return (
          <CommandPaletteSection
            key={group.label}
            group={group}
            startIndex={startIndex}
            totalCount={flatEntries.length}
            selectedIndex={selectedIndex}
            setSelectedIndex={setSelectedIndex}
          />
        );
      })}
    </div>
  );
};

export default CommandPaletteDialogContent;
