"use client";

import React from "react";
import { Message } from "@/features/chatStore";
import { formatDate } from "@/services/dateService";
import { Loader2, StopCircle } from "lucide-react";

type ChatBubbleProps = {
  message: Message;
  onAbort?: (messageId: string) => void;
  isAIGenerating?: boolean;
};

const ChatBubble: React.FC<ChatBubbleProps> = ({
  message,
  onAbort,
  isAIGenerating,
}) => {
  const isUser = message.role === "user";
  const isThinking = message.status === "thinking";
  const isSending = message.status === "sending";
  const isError = message.status === "error";
  const isAborted = message.status === "aborted";

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
        } ${isSending ? "opacity-70 animate-pulse" : ""} ${
          isError ? "bg-red-950 border-red-500/60" : ""
        } ${isAborted ? "bg-yellow-950 border-yellow-500/60" : ""}`}
      >
        {/* AI Thinking State with Abort Button */}
        {isThinking ? (
          <div className="flex items-center justify-between gap-3 py-1">
            <div className="flex items-center gap-2">
              <Loader2 className="animate-spin" size={16} />
              <span className="text-sm opacity-80">Thinking...</span>
            </div>
            {/* ✅ Abort Button */}
            {onAbort && isAIGenerating && (
              <button
                onClick={() => onAbort(message.id)}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-red-600 hover:bg-red-700 rounded-md transition-colors"
                title="Stop generation"
              >
                <StopCircle size={14} />
                Stop
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Message Text */}
            <div className="whitespace-pre-wrap leading-relaxed break-words">
              {message.text}
            </div>

            {/* Status Indicators */}
            {isSending && (
              <div className="mt-1.5 text-xs opacity-80">Sending…</div>
            )}

            {isError && (
              <div className="mt-1.5 text-xs font-semibold text-red-500">
                {message.text || "Failed to send"}
              </div>
            )}

            {isAborted && (
              <div className="mt-1.5 text-xs font-semibold text-yellow-500">
                Generation stopped
              </div>
            )}

            {message.status === "sent" && (
              <div className="mt-1.5 text-xs font-semibold text-white flex flex-row justify-end">
                {formattedDate}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ChatBubble;
