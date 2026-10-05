import React from "react";
import { useChatStore } from "@/features/chatStore";
import { FloatingDialogOverlayControls } from "@/components/helperComponents/FloatingDialog";
import TextSearchPanel from "./TextSearchPanel";
import NodeSearchPanel from "./NodeSearchPanel";

interface SearchOverlaysProps {
  // Maximize/Reset controls for the underlying FloatingDialog — the search
  // panels take over the whole dialog, so "maximize/reset the search
  // dialog" means maximizing/resetting the same dialog underneath. These
  // come from FloatingDialog itself (private state there), passed down as
  // a render-prop since there's no other way to reach them.
  dialogControls: FloatingDialogOverlayControls;
}

const SearchOverlays: React.FC<SearchOverlaysProps> = ({ dialogControls }) => {
  const activePanel = useChatStore((s) => s.activePanel);

  if (activePanel === "text") return <TextSearchPanel dialogControls={dialogControls} />;
  if (activePanel === "node") return <NodeSearchPanel dialogControls={dialogControls} />;
  return null;
};

export default SearchOverlays;
