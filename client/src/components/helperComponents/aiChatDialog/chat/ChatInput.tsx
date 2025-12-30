"use client";

import React, { useRef, useState } from "react";
import { SendHorizontal } from "lucide-react";

type ChatInputProps = {
  onSend: (chatId: string, text: string) => void;
  disabled?: boolean;
};

const ChatInput: React.FC<ChatInputProps> = ({ onSend, disabled }) => {
  const [value, setValue] = useState<string>("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (!value.trim() || disabled) return;

    onSend("jffj", value.trim());
    setValue("");

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);

    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 200) + "px";
  };

  return (
    <div className="px-1 py-1">
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Chat with Helix..."
          disabled={disabled}
          rows={1}
          autoFocus
          className="
          w-full
          flex items-center justify-center
          resize-none
          p-3
          pr-12
          rounded-2xl
          border border-gray-200
          text-base
          leading-relaxed
          outline-none
          placeholder-white
          focus:ring-1 focus:ring-white
          disabled:cursor-not-allowed
        "
        />

        <button
          onClick={handleSend}
          disabled={!value.trim() || disabled}
          className={`
          absolute
          right-2
          ${value.trim() ? "bottom-1.5" : "top-1/2-translate-y-1/2"}
          h-9 w-9
          flex items-center justify-center
          rounded-full
          transition-all
          ${
            value.trim() && !disabled
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "opacity-0 pointer-events-none"
          }
        `}
        >
          <SendHorizontal size={18} className="shrink-0 -ml-0.5" />
        </button>
      </div>
    </div>
  );
};
export default ChatInput;
