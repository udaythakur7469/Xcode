"use client";

import React from "react";
import { Input } from "@/components/ui/input";

type ContestTabsSearchProps = {
  tab: "upcoming" | "past";
  onTabChange: (tab: "upcoming" | "past") => void;
  query: string;
  onQueryChange: (query: string) => void;
};

export default function ContestTabsSearch({ tab, onTabChange, query, onQueryChange }: ContestTabsSearchProps) {
  return (
    <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
      <div className="flex gap-1 border-b flex-1 min-w-0">
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 ${tab === "upcoming" ? "border-brand" : "border-transparent text-muted-foreground"}`}
          onClick={() => onTabChange("upcoming")}
        >
          Upcoming Contests
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 ${tab === "past" ? "border-brand" : "border-transparent text-muted-foreground"}`}
          onClick={() => onTabChange("past")}
        >
          Past Contests
        </button>
      </div>
      <Input
        placeholder="Search contests…"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        className="w-56"
      />
    </div>
  );
}
