import React from "react";
import { SearchResult, SearchScope } from "@/features/chatStore";

interface SearchResultItemProps {
  result: SearchResult;
  scope: SearchScope;
  onClick: () => void;
}

function renderSnippet(
  text: string,
  highlights: Array<[number, number]> | undefined,
  matchStart: number | null,
  matchEnd: number | null,
) {
  // Fuzzy search returns one range per matched word; fall back to the legacy
  // single range if an older server responds.
  const ranges: Array<[number, number]> =
    highlights && highlights.length > 0
      ? highlights
      : matchStart !== null && matchEnd !== null
        ? [[matchStart, matchEnd]]
        : [];
  if (ranges.length === 0) return text;

  // Sort + merge overlapping ranges so <mark>s never nest or double up.
  const sorted = [...ranges].sort((a, b) => a[0] - b[0]);
  const merged: Array<[number, number]> = [];
  for (const [s, e] of sorted) {
    const last = merged[merged.length - 1];
    if (last && s <= last[1]) last[1] = Math.max(last[1], e);
    else merged.push([s, e]);
  }

  const parts: React.ReactNode[] = [];
  let cursor = 0;
  merged.forEach(([s, e], i) => {
    if (s > cursor) parts.push(text.slice(cursor, s));
    parts.push(
      <mark key={i} className="bg-yellow-400/30 text-inherit rounded-sm px-0.5">
        {text.slice(s, e)}
      </mark>,
    );
    cursor = e;
  });
  if (cursor < text.length) parts.push(text.slice(cursor));
  return <>{parts}</>;
}

const SearchResultItem: React.FC<SearchResultItemProps> = ({ result, scope, onClick }) => {
  const isUser = result.role === "user";
  const time = new Date(result.createdAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });

  return (
    <div
      onClick={onClick}
      className="flex flex-col gap-1 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-zinc-800 transition-colors"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <div
            className={`w-[18px] h-[18px] rounded-[5px] flex items-center justify-center flex-shrink-0 text-[10px] font-bold ${
              isUser
                ? "bg-[var(--brand)] text-white"
                : "bg-[var(--brand-muted)] text-[var(--brand)] border border-[var(--brand)]/30"
            }`}
          >
            {isUser ? "U" : "AI"}
          </div>
          {scope === "all" && (
            <div className="text-[10px] font-semibold text-zinc-300 bg-zinc-700 px-1.5 py-0.5 rounded-full truncate max-w-[160px]">
              {result.chatTitle}
            </div>
          )}
        </div>
        <div className="text-[10.5px] text-zinc-500 flex-shrink-0">{time}</div>
      </div>
      <div className="text-[12.5px] text-zinc-300 leading-relaxed pl-6 break-words whitespace-pre-wrap">
        {renderSnippet(result.snippet, result.highlights, result.matchStart, result.matchEnd)}
      </div>
    </div>
  );
};

export default SearchResultItem;
