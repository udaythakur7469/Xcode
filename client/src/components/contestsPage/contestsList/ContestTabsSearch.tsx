"use client";

import React from "react";
import { Search } from "lucide-react";

type ContestTabsSearchProps = {
  tab: "upcoming" | "past";
  onTabChange: (tab: "upcoming" | "past") => void;
  search: string;
  onSearchChange: (value: string) => void;
};

export default function ContestTabsSearch({ tab, onTabChange, search, onSearchChange }: ContestTabsSearchProps) {
  return (
    <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
      <h2 className="text-lg font-semibold">All contests</h2>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 bg-card border rounded-lg px-3 py-2 min-w-[220px]">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search contests…"
            className="bg-transparent outline-none text-sm w-full placeholder:text-muted-foreground"
          />
        </div>
        <div className="flex bg-muted rounded-full p-0.5">
          {(["upcoming", "past"] as const).map((t) => (
            <button
              key={t}
              onClick={() => onTabChange(t)}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-full transition-colors capitalize ${
                tab === t ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
