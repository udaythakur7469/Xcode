"use client";

import React from "react";

export const LOBBY_TABS = ["rules", "prizes", "rating", "faq"] as const;
export type LobbyTab = (typeof LOBBY_TABS)[number];

type ContestLobbyTabsProps = {
  tab: LobbyTab;
  onTabChange: (tab: LobbyTab) => void;
};

export default function ContestLobbyTabs({ tab, onTabChange }: ContestLobbyTabsProps) {
  return (
    <div className="flex gap-1 border-b mt-6">
      {LOBBY_TABS.map((t) => (
        <button
          key={t}
          className={`px-4 py-2 text-sm font-medium border-b-2 capitalize ${tab === t ? "border-brand" : "border-transparent text-muted-foreground"}`}
          onClick={() => onTabChange(t)}
        >
          {t === "faq" ? "FAQ" : t === "rating" ? "Rating Changes" : t}
        </button>
      ))}
    </div>
  );
}
