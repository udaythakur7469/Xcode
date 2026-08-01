"use client";

import React, { useEffect, useRef, useState } from "react";
import { SendHorizontal, Square } from "lucide-react";
import { useChatStore } from "@/features/chatStore";

type ChatInputProps = {
  onSend: (text: string) => void;
  disabled?: boolean;
  activeChatId: string | null;
};

const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  disabled = false,
  activeChatId,
}) => {
  const getInputDraft = useChatStore((s) => s.getInputDraft);
  const setInputDraft = useChatStore((s) => s.setInputDraft);
  const clearInputDraft = useChatStore((s) => s.clearInputDraft);
  const isActivePathGenerating = useChatStore((s) => s.isActivePathGenerating);
  const abortActiveGeneration = useChatStore((s) => s.abortActiveGeneration);

  const [value, setValue] = useState(() =>
    activeChatId ? getInputDraft(activeChatId) : "",
  );
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Swap textarea content when active chat changes
  useEffect(() => {
    const draft = activeChatId ? getInputDraft(activeChatId) : "";
    setValue(draft);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      if (draft) {
        textareaRef.current.style.height = `${Math.min(
          textareaRef.current.scrollHeight,
          200,
        )}px`;
      }
    }
    textareaRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChatId]);

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled || isActivePathGenerating) return;
    onSend(trimmed);
    setValue("");
    if (activeChatId) clearInputDraft(activeChatId);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleStop = () => {
    abortActiveGeneration();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      const newVal = value + "\n";
      setValue(newVal);
      if (activeChatId) setInputDraft(activeChatId, newVal);
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.style.height = "auto";
          textareaRef.current.style.height = `${Math.min(
            textareaRef.current.scrollHeight,
            200,
          )}px`;
        }
      });
      return;
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newVal = e.target.value;
    setValue(newVal);
    if (activeChatId) setInputDraft(activeChatId, newVal);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
  };

  const canSend =
    value.trim().length > 0 && !disabled && !isActivePathGenerating;

  return (
    <div className="px-2 py-2">
      <div className="flex items-start gap-1">
        <div className="relative flex-1">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={
              isActivePathGenerating
                ? "AI is generating a response…"
                : "Chat with Nova… (Enter to send, Ctrl+Enter for newline)"
            }
            disabled={disabled}
            rows={1}
            spellCheck={false}
            className="
              w-full resize-none
              min-h-12
              px-4 py-3
              rounded-2xl border border-zinc-600
              bg-zinc-800 text-white text-sm
              placeholder-zinc-500
              leading-relaxed outline-none
              focus:ring-1 focus:ring-[var(--brand)] focus:border-[var(--brand)]
              disabled:cursor-not-allowed disabled:opacity-50
              transition-colors
            "
          />
        </div>

        {/* Stop button — shown while AI is generating on active path */}
        {isActivePathGenerating ? (
          <button
            onClick={handleStop}
            title="Stop generation"
            className="
              flex-shrink-0
              h-12 w-12
              flex items-center justify-center
              rounded-xl
              bg-red-600 hover:bg-red-500
              text-white
              transition-colors duration-150
            "
          >
            <Square size={14} className="fill-white" />
          </button>
        ) : (
          /* Send button — shown when input has text and AI is idle */
          <button
            onClick={handleSend}
            disabled={!canSend}
            className={`
              flex-shrink-0
              h-12 w-12
              flex items-center justify-center
              rounded-xl
              transition-all duration-150
              ${
                canSend
                  ? "bg-[var(--brand)] hover:bg-[var(--brand-dim)] text-white"
                  : "bg-zinc-700 text-zinc-500 pointer-events-none"
              }
            `}
          >
            <SendHorizontal size={16} className="-ml-px" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ChatInput;
