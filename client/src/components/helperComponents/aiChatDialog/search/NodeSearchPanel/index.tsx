import React, { useEffect, useRef, useState } from "react";
import { GitBranch } from "lucide-react";
import { useChatStore } from "@/features/chatStore";
import { FloatingDialogOverlayControls } from "@/components/helperComponents/FloatingDialog";
import ScopeToggle from "../shared/ScopeToggle";
import PanelWindowControls from "../shared/PanelWindowControls";
import TreeCanvas, { TreeCanvasHandle } from "./TreeCanvas";
import GraphSearchBar from "./GraphSearchBar";
import ZoomControls from "./ZoomControls";

interface NodeSearchPanelProps {
  dialogControls: FloatingDialogOverlayControls;
}

const NodeSearchPanel: React.FC<NodeSearchPanelProps> = ({ dialogControls }) => {
  const nodeScope = useChatStore((s) => s.nodeScope);
  const nodeGraphOpenedFromChatId = useChatStore((s) => s.nodeGraphOpenedFromChatId);
  const setNodeScope = useChatStore((s) => s.setNodeScope);
  const closeSearchPanel = useChatStore((s) => s.closeSearchPanel);

  const revealMessage = useChatStore((s) => s.revealMessage);
  const getUserChats = useChatStore((s) => s.getUserChats);
  const userChats = useChatStore((s) => s.userChats);

  const treeRef = useRef<TreeCanvasHandle>(null);
  const [matchCount, setMatchCount] = useState(0);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(-1);

  // All Chats mode needs the chat list — fetch once if not already loaded.
  useEffect(() => {
    if (nodeScope === "all" && userChats.length === 0) {
      getUserChats().catch((err) => console.error("Failed to load chat list:", err));
    }
  }, [nodeScope, userChats.length, getUserChats]);

  const handleScopeChange = (scope: "chat" | "all") => {
    setNodeScope(scope);
  };

  const handleRevealMessage = async (chatId: string, messageId: string) => {
    closeSearchPanel();
    await revealMessage(chatId, messageId);
  };

  return (
    <div
      data-graph-panel
      className="w-full h-full bg-[var(--background)] border border-white/10 rounded-lg shadow-lg flex flex-col overflow-hidden relative"
    >
      {/* Header */}
      <div className="p-3 flex items-center justify-between bg-gradient-to-b from-[var(--brand-muted)] to-transparent border-b border-white/5 flex-shrink-0">
        <div className="flex items-center gap-3 ml-2">
          <GitBranch size={19} className="text-[var(--brand)]" />
          <span className="text-lg font-semibold">Message Tree</span>
          <div className="ml-2">
            <ScopeToggle scope={nodeScope} onChange={handleScopeChange} />
          </div>
        </div>
        <PanelWindowControls dialogControls={dialogControls} onBackToChat={closeSearchPanel} />
      </div>

      <GraphSearchBar
        matchCount={matchCount}
        currentMatchIndex={currentMatchIndex}
        totalMatches={matchCount}
        onEnter={() => treeRef.current?.jumpToNextMatch()}
      />

      <TreeCanvas
        ref={treeRef}
        scope={nodeScope}
        openedFromChatId={nodeGraphOpenedFromChatId}
        onRevealMessage={handleRevealMessage}
        onMatchesChange={(count, index) => {
          setMatchCount(count);
          setCurrentMatchIndex(index);
        }}
      />

      <ZoomControls
        onZoomIn={() => treeRef.current?.zoomIn()}
        onZoomOut={() => treeRef.current?.zoomOut()}
      />
    </div>
  );
};

export default NodeSearchPanel;
