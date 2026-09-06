import React, { useEffect, useRef } from "react";
import { Search } from "lucide-react";
import { useChatStore } from "@/features/chatStore";

interface GraphSearchBarProps {
  matchCount: number;
  currentMatchIndex: number;
  totalMatches: number;
  onEnter: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Do not confuse this with Alt+F (which switches away from Node Search
// entirely and opens the standalone Text Search panel). Ctrl+F here stays
// inside the tree, only while Node Search is open — must not fire, and
// must not preventDefault, anywhere else on the site.
// ─────────────────────────────────────────────────────────────────────────────
const GraphSearchBar: React.FC<GraphSearchBarProps> = ({
  matchCount,
  currentMatchIndex,
  totalMatches,
  onEnter,
}) => {
  const graphSearchOpen = useChatStore((s) => s.graphSearchOpen);
  const graphSearchQuery = useChatStore((s) => s.graphSearchQuery);
  const openGraphSearch = useChatStore((s) => s.openGraphSearch);
  const setGraphSearchQuery = useChatStore((s) => s.setGraphSearchQuery);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && (e.key === "f" || e.key === "F")) {
        e.preventDefault();
        openGraphSearch();
        requestAnimationFrame(() => inputRef.current?.focus());
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [openGraphSearch]);

  useEffect(() => {
    if (graphSearchOpen) inputRef.current?.focus();
  }, [graphSearchOpen]);

  if (!graphSearchOpen) return null;

  return (
    <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/5 bg-zinc-900 flex-shrink-0">
      <Search size={15} className="text-zinc-400 flex-shrink-0" />
      <input
        ref={inputRef}
        type="text"
        value={graphSearchQuery}
        onChange={(e) => setGraphSearchQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && matchCount > 0) {
            e.preventDefault();
            onEnter();
          }
        }}
        placeholder="Search message text in this tree… (Ctrl+F)"
        className="flex-1 bg-transparent border-none outline-none text-white text-[13px] placeholder:text-zinc-500"
      />
      <span className="text-[11px] text-zinc-500 flex-shrink-0">
        {graphSearchQuery.trim() === ""
          ? ""
          : matchCount === 0
            ? "No matches"
            : currentMatchIndex >= 0
              ? `Match ${currentMatchIndex + 1} of ${totalMatches}`
              : `${matchCount} match${matchCount !== 1 ? "es" : ""} — Enter to jump`}
      </span>
    </div>
  );
};

export default GraphSearchBar;
