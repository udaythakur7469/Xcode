"use client";

import React, { useRef, useEffect, useCallback } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

type AIWritePanelProps = {
  isOpen: boolean;
  aiPrompt: string;
  isGenerating: boolean;
  onPromptChange: (value: string) => void;
  onGenerate: () => void;
  onCancel: () => void;
};

const AIWritePanel: React.FC<AIWritePanelProps> = ({
  isOpen,
  aiPrompt,
  isGenerating,
  onPromptChange,
  onGenerate,
  onCancel,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus the prompt textarea when the panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Auto-grow the textarea up to a max of 1/3 of a typical editor height
  const handlePromptInput = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onPromptChange(e.target.value);
      const el = e.target;
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 160) + "px";
    },
    [onPromptChange],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isGenerating) onGenerate();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="ai-panel"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          // Anchored to the bottom of the left column, starting after the
          // line-numbers column (~36px wide). Does not overlap line numbers.
          className="absolute bottom-0 right-0 z-20 flex flex-col gap-2.5 rounded-2xl border border-violet-500 bg-background p-3 shadow-[0_0_0_4px_rgba(139,92,246,0.08)]"
          style={{ left: "calc(36px + 10px)" }}
        >
          {/* Panel header */}
          <div className="flex items-center gap-1.5 text-xs font-medium text-violet-500">
            <Sparkles size={14} />
            Write with AI
          </div>

          {/* Prompt textarea — pill shape, grows vertically */}
          <textarea
            ref={textareaRef}
            value={aiPrompt}
            onChange={handlePromptInput}
            onKeyDown={handleKeyDown}
            placeholder="Describe the kind of post you want the AI to generate..."
            rows={1}
            disabled={isGenerating}
            className="w-full resize-none rounded-2xl border bg-muted px-4 py-2.5 text-sm leading-relaxed outline-none transition-colors placeholder:text-muted-foreground focus:border-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
            style={{ minHeight: "38px", maxHeight: "160px", overflow: "auto" }}
          />

          {/* Actions row */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Enter to generate &nbsp;·&nbsp; Shift+Enter for newline
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={onCancel}
                disabled={isGenerating}
                className="rounded-lg border px-3 py-1 text-sm text-muted-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={onGenerate}
                disabled={isGenerating || !aiPrompt.trim()}
                className="flex items-center gap-1.5 rounded-lg bg-violet-500 px-4 py-1 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-55"
              >
                {isGenerating && <Loader2 size={13} className="animate-spin" />}
                {isGenerating ? "Generating..." : "Generate"}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AIWritePanel;
