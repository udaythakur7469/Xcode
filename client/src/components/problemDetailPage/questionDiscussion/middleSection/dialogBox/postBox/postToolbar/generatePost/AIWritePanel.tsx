"use client";

import React, {
  useRef,
  useEffect,
  useCallback,
  useState,
  useMemo,
} from "react";
import {
  Sparkles,
  Loader2,
  Square,
  RefreshCw,
  Clock,
  ChevronDown,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

// ── Types ─────────────────────────────────────────────────────────────────────

export type AIMode = "write" | "continue" | "improve" | "summarize";
export type AITone = "technical" | "beginner" | "concise" | "detailed";

type AIWritePanelProps = {
  isOpen: boolean;
  aiPrompt: string;
  isGenerating: boolean;
  hasGenerated: boolean;
  mode: AIMode;
  tone: AITone;
  promptHistory?: string[];
  problemTitle?: string;
  onPromptChange: (value: string) => void;
  onGenerate: () => void;
  onAbort: () => void;
  onRegenerate: () => void;
  onCancel: () => void;
  onModeChange: (mode: AIMode) => void;
  onToneChange?: (tone: AITone) => void;
};

// ── Constants ─────────────────────────────────────────────────────────────────

const MODE_LABELS: Record<AIMode, string> = {
  write: "Write",
  continue: "Continue",
  improve: "Improve",
  summarize: "Summarize",
};

const MODE_PLACEHOLDERS: Record<AIMode, string> = {
  write: "Describe the kind of post you want the AI to generate...",
  continue: "What should the AI continue writing about?",
  improve: "What aspect should the AI improve?",
  summarize: "What should be summarized?",
};

const buildChips = (mode: AIMode, problemTitle?: string): string[] => {
  const p = problemTitle || "this problem";
  return (
    {
      write: [
        "Explain my approach step-by-step",
        "Write a beginner-friendly guide",
        "Add time & space complexity analysis",
        `Compare Brute Force vs Optimal solutions for ${p}`,
      ],
      continue: [
        "Add edge cases and sample test inputs",
        "Expand the complexity analysis section",
        `Add a follow-up problem related to ${p}`,
        "Write a final summary conclusion",
      ],
      improve: [
        "Make this clearer and more structured",
        "Improve the explanation for a beginner",
        "Refactor code block readability & comments",
        "Make it more concise and remove redundancy",
      ],
      summarize: [
        "Summarize key insights in bullet points",
        "Give a one-paragraph TL;DR",
        `Summarize the approach used for ${p}`,
        "Create a time/space complexity summary table",
      ],
    }[mode] ?? []
  );
};

const TONE_OPTIONS: { value: AITone; label: string }[] = [
  { value: "technical", label: "Technical" },
  { value: "beginner", label: "Beginner-friendly" },
  { value: "concise", label: "Concise" },
  { value: "detailed", label: "Detailed" },
];

// ── Component ─────────────────────────────────────────────────────────────────

const AIWritePanel: React.FC<AIWritePanelProps> = ({
  isOpen,
  aiPrompt,
  isGenerating,
  hasGenerated,
  mode,
  tone,
  promptHistory = [],
  problemTitle,
  onPromptChange,
  onGenerate,
  onAbort,
  onRegenerate,
  onCancel,
  onModeChange,
  onToneChange,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const historyRef = useRef<HTMLDivElement>(null);

  // Auto-focus on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Close history dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        historyRef.current &&
        !historyRef.current.contains(e.target as Node)
      ) {
        setIsHistoryOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Auto-grow textarea
  const handlePromptInput = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onPromptChange(e.target.value);
      const el = e.target;
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 160) + "px";
    },
    [onPromptChange],
  );

  // Reset textarea height when prompt is cleared externally
  useEffect(() => {
    if (!aiPrompt && textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [aiPrompt]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isGenerating) handlePrimaryAction();
    }
  };

  // Chips — shown only when prompt is empty
  const chips = useMemo(
    () => buildChips(mode, problemTitle) ?? [],
    [mode, problemTitle],
  );
  const showChips = !aiPrompt.trim();

  const handleChipClick = (chip: string) => {
    onPromptChange(chip);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height =
          Math.min(textareaRef.current.scrollHeight, 160) + "px";
        textareaRef.current.focus();
      }
    }, 0);
  };

  // Determine which action the primary button triggers
  const handlePrimaryAction = () => {
    if (isGenerating) {
      onAbort();
    } else if (hasGenerated && aiPrompt === promptHistory[0]) {
      onRegenerate();
    } else {
      onGenerate();
    }
  };

  // Regenerate is shown only after a successful generation AND
  // the prompt hasn't been changed from what was last used
  const showRegenerate =
    hasGenerated && !isGenerating && aiPrompt === promptHistory[0];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="ai-panel"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          // Anchored to the bottom of the left column.
          // left offset clears the line-numbers column (~36px).
          className="absolute bottom-0 right-0 z-20 flex flex-col gap-2 rounded-t-2xl border border-violet-500 border-b-0 bg-background p-3 shadow-[0_0_0_4px_rgba(139,92,246,0.08)]"
          style={{ left: "calc(36px + 8px)" }}
        >
          {/* ── Header ──────────────────────────────────────────────────── */}
          <div className="flex items-center gap-1.5 text-xs font-medium text-violet-500">
            <Sparkles size={13} />
            Write with AI
          </div>

          {/* ── Mode selector ────────────────────────────────────────────── */}
          <div className="flex gap-1 rounded-lg bg-muted p-1">
            {(Object.keys(MODE_LABELS) as AIMode[]).map((m) => (
              <button
                key={m}
                disabled={isGenerating}
                onClick={() => onModeChange(m)}
                className={`flex-1 rounded-md py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                  mode === m
                    ? "bg-background text-foreground shadow-sm border"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {MODE_LABELS[m]}
              </button>
            ))}
          </div>

          {/* ── Prompt textarea ──────────────────────────────────────────── */}
          <textarea
            ref={textareaRef}
            value={aiPrompt}
            onChange={handlePromptInput}
            onKeyDown={handleKeyDown}
            placeholder={MODE_PLACEHOLDERS[mode]}
            rows={1}
            disabled={isGenerating}
            className="w-full resize-none rounded-2xl border bg-muted px-4 py-2.5 text-sm leading-relaxed outline-none transition-colors placeholder:text-muted-foreground focus:border-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
            style={{ minHeight: "38px", maxHeight: "160px", overflow: "auto" }}
          />

          {/* ── Quick-start chips ─────────────────────────────────────────── */}
          <AnimatePresence>
            {showChips && (
              <motion.div
                key="chips"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.15 }}
                className="flex flex-wrap gap-1.5 overflow-hidden"
              >
                {chips.map((chip) => (
                  <button
                    key={chip}
                    onClick={() => handleChipClick(chip)}
                    className="rounded-full border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-violet-500 hover:bg-violet-50 hover:text-violet-600 dark:hover:bg-violet-950/30 dark:hover:text-violet-400"
                  >
                    {chip}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Footer ───────────────────────────────────────────────────── */}
          <div className="flex items-center justify-between gap-2">
            {/* Left: hint + history + tone */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground hidden sm:block">
                ↵ generate &nbsp;·&nbsp; ⇧↵ newline
              </span>

              {/* History dropdown */}
              <div className="relative" ref={historyRef}>
                <button
                  onClick={() => setIsHistoryOpen((p) => !p)}
                  title="Prompt history"
                  className="flex items-center justify-center rounded-lg border p-1.5 text-muted-foreground transition-colors hover:bg-accent"
                >
                  <Clock size={13} />
                </button>

                <AnimatePresence>
                  {isHistoryOpen && (
                    <motion.div
                      key="history"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      transition={{ duration: 0.12 }}
                      className="absolute bottom-full left-0 mb-1.5 z-30 min-w-[220px] rounded-xl border bg-popover p-1.5 shadow-lg"
                    >
                      {promptHistory.length === 0 ? (
                        <p className="px-3 py-2 text-xs text-muted-foreground text-center">
                          No history yet
                        </p>
                      ) : (
                        promptHistory.map((item, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              onPromptChange(item);
                              setIsHistoryOpen(false);
                              setTimeout(() => {
                                if (textareaRef.current) {
                                  textareaRef.current.style.height = "auto";
                                  textareaRef.current.style.height =
                                    Math.min(
                                      textareaRef.current.scrollHeight,
                                      160,
                                    ) + "px";
                                  textareaRef.current.focus();
                                }
                              }, 0);
                            }}
                            className="block w-full truncate rounded-lg px-3 py-2 text-left text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                            title={item}
                          >
                            {item.length > 50 ? item.slice(0, 48) + "…" : item}
                          </button>
                        ))
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Tone dropdown */}
              <div className="relative flex items-center">
                <select
                  value={tone}
                  disabled={isGenerating}
                  onChange={(e) => onToneChange(e.target.value as AITone)}
                  className="h-[30px] appearance-none rounded-lg border bg-background pl-2.5 pr-6 text-xs text-muted-foreground outline-none transition-colors hover:border-violet-500 focus:border-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {TONE_OPTIONS.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={11}
                  className="pointer-events-none absolute right-1.5 text-muted-foreground"
                />
              </div>
            </div>

            {/* Right: Cancel + primary action */}
            <div className="flex items-center gap-2">
              <button
                onClick={onCancel}
                disabled={isGenerating}
                className="rounded-lg border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              {/* Stop button — shown while generating */}
              {isGenerating && (
                <button
                  onClick={onAbort}
                  className="flex items-center gap-1.5 rounded-lg bg-destructive px-3 py-1.5 text-xs font-medium text-destructive-foreground transition-opacity hover:opacity-90"
                >
                  <Square size={11} />
                  Stop
                </button>
              )}

              {/* Regenerate — shown after successful generation when prompt unchanged */}
              {!isGenerating && showRegenerate && (
                <button
                  onClick={onRegenerate}
                  disabled={!aiPrompt.trim()}
                  className="flex items-center gap-1.5 rounded-lg border border-violet-500 bg-violet-50 px-3 py-1.5 text-xs font-medium text-violet-600 transition-colors hover:bg-violet-100 dark:bg-violet-950/30 dark:text-violet-400 dark:hover:bg-violet-950/50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <RefreshCw size={11} />
                  Regenerate
                </button>
              )}

              {/* Generate — shown when not generating and not in regen state */}
              {!isGenerating && !showRegenerate && (
                <button
                  onClick={onGenerate}
                  disabled={!aiPrompt.trim()}
                  className="flex items-center gap-1.5 rounded-lg bg-violet-500 px-4 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-55"
                >
                  Generate
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AIWritePanel;
