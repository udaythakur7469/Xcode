"use client";

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/features/userStore";
import type { CommandBarGroup } from "./commandBarData/commandBarTypes";
import { useCommandBarNavItems } from "./commandBarData/useCommandBarNavItems";
import { useCommandBarAuthItems } from "./commandBarData/useCommandBarAuthItems";
import { useCommandBarQuickActions } from "./commandBarData/useCommandBarQuickActions";
import { useCommandBarProblemSearch } from "./commandBarData/useCommandBarProblemSearch";
import { useCommandBarRecentlyViewed } from "./commandBarData/useCommandBarRecentlyViewed";
import { useCommandBarKeyboardNav } from "./useCommandBarKeyboardNav";
import CommandBarSection from "./commandBarSection/CommandBarSection";
import CommandBarEmptyState from "./commandBarSection/CommandBarEmptyState";

type CommandBarDialogContentProps = {
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

const CommandBarDialogContent: React.FC<CommandBarDialogContentProps> = ({
  onClose,
  onOpenLogin,
  onOpenSignup,
  onOpenLogout,
  onOpenAIChat,
  searchQuery = "",
}) => {
  const router = useRouter();
  const { userData } = useUserStore();

  const navItems = useCommandBarNavItems(onClose);

  const authItems = useCommandBarAuthItems({
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

  const quickActionItems = useCommandBarQuickActions({
    onNavigate: onClose,
    onOpenAIChat: () => {
      onClose();
      onOpenAIChat();
    },
  });

  const problemResults = useCommandBarProblemSearch(searchQuery, onClose);
  const recentlyViewedItems = useCommandBarRecentlyViewed(onClose);

  const isSearching = searchQuery.trim().length > 0;

  const groups: CommandBarGroup[] = useMemo(() => {
    const filteredNav = navItems.filter((e) =>
      matchesSearch(searchQuery, e.title, e.subtitle),
    );
    const filteredAuth = authItems.filter((e) =>
      matchesSearch(searchQuery, e.title, e.subtitle),
    );
    const filteredQuick = quickActionItems.filter((e) =>
      matchesSearch(searchQuery, e.title, e.subtitle),
    );

    const result: CommandBarGroup[] = [
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
    useCommandBarKeyboardNav(flatEntries);

  if (flatEntries.length === 0) {
    return <CommandBarEmptyState searchQuery={searchQuery} />;
  }

  let runningIndex = 0;

  return (
    <div>
      {groups.map((group) => {
        const startIndex = runningIndex;
        runningIndex += group.items.length;
        return (
          <CommandBarSection
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

export default CommandBarDialogContent;
