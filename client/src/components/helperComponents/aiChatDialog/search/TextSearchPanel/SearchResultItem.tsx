import React from "react";
import { SearchResult, SearchScope } from "@/features/chatStore";

interface SearchResultItemProps {
  result: SearchResult;
  scope: SearchScope;
  onClick: () => void;
}

function renderSnippet(text: string, matchStart: number | null, matchEnd: number | null) {
  if (matchStart === null || matchEnd === null) return text;
  return (
    <>
      {text.slice(0, matchStart)}
      <mark className="bg-yellow-400/30 text-inherit rounded-sm px-0.5">
        {text.slice(matchStart, matchEnd)}
      </mark>
      {text.slice(matchEnd)}
    </>
  );
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
      <div className="text-[12.5px] text-zinc-300 leading-relaxed pl-6">
        {renderSnippet(result.snippet, result.matchStart, result.matchEnd)}
      </div>
    </div>
  );
};

export default SearchResultItem;
