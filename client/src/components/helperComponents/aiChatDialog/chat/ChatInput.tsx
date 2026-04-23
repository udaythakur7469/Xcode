"use client";

import React, { useEffect, useRef, useState } from "react";
import { SendHorizontal } from "lucide-react";
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

  // Seed value from localStorage on first render
  const [value, setValue] = useState(() =>
    activeChatId ? getInputDraft(activeChatId) : "",
  );

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // When activeChatId changes (chat switch), swap content to the new chat's draft
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
    if (!trimmed || disabled) return;

    onSend(trimmed);
    setValue("");
    if (activeChatId) clearInputDraft(activeChatId);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Shift+Enter → insert newline
    if (e.shiftKey && (e.ctrlKey || e.metaKey)) {
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

    // Enter alone → send
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newVal = e.target.value;
    setValue(newVal);

    // Persist draft to localStorage on every keystroke
    if (activeChatId) {
      setInputDraft(activeChatId, newVal);
    }

    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
  };

  const canSend = value.trim().length > 0 && !disabled;

  return (
    <div className="px-2 py-2">
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Chat with Nova… (Enter to send, Shift+Enter for newline)"
          disabled={disabled}
          rows={1}
          className="
            w-full resize-none
            px-3 py-2.5 pr-12
            rounded-2xl border border-zinc-600
            bg-zinc-800 text-white text-sm
            placeholder-zinc-500
            leading-relaxed outline-none
            focus:ring-1 focus:ring-white focus:border-white
            disabled:cursor-not-allowed disabled:opacity-50
            transition-colors
          "
        />

        <button
          onClick={handleSend}
          disabled={!canSend}
          className={`
            absolute right-2 bottom-2
            h-8 w-8
            flex items-center justify-center
            rounded-full
            transition-all duration-150
            ${
              canSend
                ? "bg-blue-600 hover:bg-blue-500 text-white"
                : "opacity-0 pointer-events-none"
            }
          `}
        >
          <SendHorizontal size={16} className="-ml-px" />
        </button>
      </div>
    </div>
  );
};

export default ChatInput;
