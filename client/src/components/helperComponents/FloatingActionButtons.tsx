"use client";

import React from "react";
import { MessageSquare, Terminal } from "lucide-react";
import FAB from "./FAB";
import { useFABSystem } from "@/hooks/useFABSystem";
import FloatingDialog from "./FloatingDialog";

const FloatingActionButtons = () => {
  const {
    isMounted,
    aiChatVisible,
    commandPaletteVisible,
    positions,
    sides,
    isDragging,
    draggedButton,
    repelledButton,
    aiChatDialogOpen,
    commandPaletteDialogOpen,
    setAiChatPermanentlyHidden,
    setCommandPalettePermanentlyHidden,
    setAiChatDialogOpen,
    setCommandPaletteDialogOpen,
    handleDragStart,
    handleFABClick,
  } = useFABSystem();

  if (!isMounted) {
    return null;
  }

  return (
    <>
      {/* AI Chat FAB */}
      {aiChatVisible && (
        <FAB
          icon={<MessageSquare size={24} />}
          label="AI Chat (⌘/Ctrl+Q)"
          onClick={() => handleFABClick("aiChat")}
          onClose={() => setAiChatPermanentlyHidden(true)}
          position={positions.aiChat}
          onDragStart={handleDragStart("aiChat")}
          isDragging={isDragging === "aiChat"}
          side={sides.aiChat}
          isBeingRepelled={repelledButton === "aiChat"}
        />
      )}

      {/* Command Palette FAB */}
      {commandPaletteVisible && (
        <FAB
          icon={<Terminal size={24} />}
          label="Command Palette (Ctrl+K)"
          onClick={() => handleFABClick("commandPalette")}
          onClose={() => setCommandPalettePermanentlyHidden(true)}
          position={positions.commandPalette}
          onDragStart={handleDragStart("commandPalette")}
          isDragging={isDragging === "commandPalette"}
          side={sides.commandPalette}
          isBeingRepelled={repelledButton === "commandPalette"}
        />
      )}

      {/* AI Chat Dialog */}
      <FloatingDialog
        open={aiChatDialogOpen}
        onOpenChange={setAiChatDialogOpen}
        title="AI Chat"
        defaultSize={{ width: 600, height: 500 }}
        enableReset={true}
      >
        <div className="h-full flex justify-center items-center">
          AI chat box
        </div>
      </FloatingDialog>

      {/* Command Palette Dialog */}
      <FloatingDialog
        open={commandPaletteDialogOpen}
        onOpenChange={setCommandPaletteDialogOpen}
        title="Command Palette"
        defaultSize={{ width: 600, height: 400 }}
        enableReset={true}
      >
        <div className="h-full flex justify-center items-center">
          Command Palette content
        </div>
      </FloatingDialog>
    </>
  );
};

export default FloatingActionButtons;
