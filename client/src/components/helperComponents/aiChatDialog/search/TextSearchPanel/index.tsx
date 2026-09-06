import React, { useRef } from "react";
import { Search } from "lucide-react";
import { useChatStore } from "@/features/chatStore";
import { FloatingDialogOverlayControls } from "@/components/helperComponents/FloatingDialog";
import ScopeToggle from "../shared/ScopeToggle";
import PanelWindowControls from "../shared/PanelWindowControls";
import SearchResultItem from "./SearchResultItem";

interface TextSearchPanelProps {
  dialogControls: FloatingDialogOverlayControls;
}

const TextSearchPanel: React.FC<TextSearchPanelProps> = ({ dialogControls }) => {
  const textQuery = useChatStore((s) => s.textQuery);
  const textScope = useChatStore((s) => s.textScope);
  const textResults = useChatStore((s) => s.textResults);
  const isSearchingText = useChatStore((s) => s.isSearchingText);
  const setTextQuery = useChatStore((s) => s.setTextQuery);
  const setTextScope = useChatStore((s) => s.setTextScope);
  const closeSearchPanel = useChatStore((s) => s.closeSearchPanel);

  const revealMessage = useChatStore((s) => s.revealMessage);

  const inputRef = useRef<HTMLInputElement>(null);

  const handleResultClick = async (chatId: string, messageId: string) => {
    closeSearchPanel();
    await revealMessage(chatId, messageId);
  };

  return (
    <div className="w-full h-full bg-[var(--background)] border border-white/10 rounded-lg shadow-lg flex flex-col overflow-hidden">
      {/* Header — same chrome family as the dialog's own header */}
      <div className="p-3 flex items-center justify-between bg-gradient-to-b from-[var(--brand-muted)] to-transparent border-b border-white/5 flex-shrink-0">
        <div className="flex items-center gap-3 ml-2">
          <Search size={19} />
          <span className="text-lg font-semibold">Search</span>
          <div className="ml-2">
            <ScopeToggle scope={textScope} onChange={setTextScope} />
          </div>
        </div>
        <PanelWindowControls dialogControls={dialogControls} onBackToChat={closeSearchPanel} />
      </div>

      {/* Search input */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
        <Search size={16} className="text-zinc-400 flex-shrink-0" />
        <input
          ref={inputRef}
          autoFocus
          type="text"
          value={textQuery}
          onChange={(e) => setTextQuery(e.target.value)}
          placeholder="Search messages…"
          className="flex-1 bg-transparent border-none outline-none text-white text-sm placeholder:text-zinc-500"
        />
      </div>

      <div className="px-4 pt-2 text-[11px] text-zinc-500 max-w-[640px] mx-auto w-full">
        {textQuery.trim() &&
          !isSearchingText &&
          `${textResults.length} result${textResults.length !== 1 ? "s" : ""} for "${textQuery.trim()}"`}
        {isSearchingText && "Searching…"}
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 max-w-[640px] mx-auto w-full">
        {!textQuery.trim() ? (
          <div className="py-10 text-center text-zinc-500 text-sm">
            Start typing to search your {textScope === "chat" ? "current chat" : "chats"}.
          </div>
        ) : !isSearchingText && textResults.length === 0 ? (
          <div className="py-10 text-center text-zinc-500 text-sm">
            No messages found for &quot;{textQuery.trim()}&quot;.
          </div>
        ) : (
          textResults.map((result) => (
            <SearchResultItem
              key={result.messageId}
              result={result}
              scope={textScope}
              onClick={() => handleResultClick(result.chatId, result.messageId)}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default TextSearchPanel;
