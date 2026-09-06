import React from "react";
import { ArrowLeft, Maximize, Minimize, RotateCcw, X } from "lucide-react";
import { FloatingDialogOverlayControls } from "@/components/helperComponents/FloatingDialog";

interface PanelWindowControlsProps {
  dialogControls: FloatingDialogOverlayControls;
  // Returns to the main chat — closes ONLY this search panel, the AI chat
  // dialog itself stays open underneath.
  onBackToChat: () => void;
}

// Mirrors FloatingDialog's own header buttons (same icons, same color
// classes for Maximize/Reset/Close) — since these panels take over the
// whole dialog including its real header, Maximize/Reset/Close here act
// on that same underlying dialog, not on the panel itself.
//
// Two distinct close-shaped actions, deliberately different icons so
// they're never confused:
//   ArrowLeft → back to chat only (search panel closes, dialog stays open)
//   X         → closes the whole AI chat dialog (same as its own header X,
//               which is otherwise unreachable while a panel covers it)
const PanelWindowControls: React.FC<PanelWindowControlsProps> = ({
  dialogControls,
  onBackToChat,
}) => {
  const { isMaximized, onMaximize, onReset, onCloseDialog } = dialogControls;

  return (
    <div className="flex items-center gap-2 mr-2">
      <button
        onClick={onBackToChat}
        className="rounded p-2 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
        title="Back to chat"
      >
        <ArrowLeft size={15} strokeWidth={3} />
      </button>
      <button
        onClick={onMaximize}
        className="rounded p-2 text-[var(--brand)] hover:bg-[var(--brand-muted)]"
        title={isMaximized ? "Minimize" : "Maximize"}
      >
        {isMaximized ? (
          <Minimize size={15} strokeWidth={3} />
        ) : (
          <Maximize size={15} strokeWidth={3} />
        )}
      </button>
      <button
        onClick={onReset}
        className="rounded p-2 text-yellow-300 hover:bg-yellow-900 hover:text-yellow-500"
        title="Reset position and size"
      >
        <RotateCcw size={15} strokeWidth={3} />
      </button>
      <button
        onClick={onCloseDialog}
        className="rounded p-2 text-red-500 hover:bg-red-900"
        title="Close"
      >
        <X size={15} strokeWidth={3} />
      </button>
    </div>
  );
};

export default PanelWindowControls;
