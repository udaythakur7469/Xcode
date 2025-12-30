"use client";

import React from "react";
import { Message } from "@/features/chatStore";
import { formatDate } from "@/services/dateService";

type ChatBubbleProps = { message: Message };

const ChatBubble: React.FC<ChatBubbleProps> = ({ message }) => {
  const isUser = message.role === "user";

  const formattedDate = formatDate(message.updatedAt);
  return (
    <div
      className={`flex flex-row mb-3 ${
        isUser ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`max-w-[60%] py-1 px-3 rounded-xl border text-white ${
          isUser ? "bg-blue-600 border-blue-500" : "bg-zinc-800 border-zinc-700"
        }${message.status === "sending" ? "opacity-70 animate-pulse" : ""}
  ${message.status === "error" ? "bg-red-950 border-red-500/60" : ""}`}
      >
        <div
          className={`whitespace-pre-wrap leading-relaxed ${
            isUser ? "justify-end" : "justify-start"
          }`}
        >
          {message.text}
        </div>
        {message.status === "sending" && (
          <div className="mt-1.5 text-xs opacity-80">Sending…</div>
        )}

        {message.status === "error" && (
          <div className="mt-1.5 text-xs font-semibold text-red-500">
            Failed to send
          </div>
        )}
        {message.status === "sent" && (
          <div className="mt-1.5 text-xs font-semibold text-white flex flex-row justify-end">
            {formattedDate}
          </div>
        )}
      </div>
    </div>
  );
};
export default ChatBubble;
