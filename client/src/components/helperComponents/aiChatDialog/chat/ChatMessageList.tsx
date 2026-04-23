"use client";

import React, { useEffect, useLayoutEffect, useRef } from "react";
import { MoonLoader } from "react-spinners";
import { Message, useChatStore } from "@/features/chatStore";
import ChatBubble from "./ChatBubble";

type ChatMessageListProps = {
  messages: Message[];
  activeChatId: string | null;
  isLoading: boolean;
  error: string | null;
};

const ChatMessageList: React.FC<ChatMessageListProps> = ({
  messages,
  activeChatId,
  isLoading,
  error,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // true = next message render is the first load for this chat,
  // so we snap instantly before paint instead of smooth scrolling.
  const isInitialLoad = useRef(true);

  const isAIGenerating = useChatStore((s) => s.isAIGenerating);
  const abortAIGeneration = useChatStore((s) => s.abortAIGeneration);
  const regenerateMessage = useChatStore((s) => s.regenerateMessage);
  const editAndResendMessage = useChatStore((s) => s.editAndResendMessage);

  // Reset the flag whenever the active chat changes so every chat
  // switch gets an instant snap regardless of prior scroll position.
  useLayoutEffect(() => {
    isInitialLoad.current = true;
  }, [activeChatId]);

  // Fires BEFORE the browser paints — user never sees the top of
  // the conversation on initial load (WhatsApp behaviour).
  useLayoutEffect(() => {
    if (messages.length === 0) return;

    if (isInitialLoad.current) {
      if (containerRef.current) {
        containerRef.current.scrollTop = containerRef.current.scrollHeight;
      }
      isInitialLoad.current = false;
    }
  }, [messages]);

  // Fires AFTER paint — smooth scroll for each new message that
  // arrives after the initial load (e.g. AI response, user send).
  useEffect(() => {
    if (isInitialLoad.current) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  if (error) {
    return (
      <div className="flex h-full items-center justify-center p-4 text-sm text-red-400">
        {error}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <MoonLoader color="#ffffff" size={28} />
      </div>
    );
  }

  if (!activeChatId) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-zinc-500">
        Select a chat or create a new one
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-zinc-500">
        Start the conversation by sending a message
      </div>
    );
  }

  const handleRegenerate = (userMessageId: string) => {
    if (!activeChatId) return;
    regenerateMessage(activeChatId, userMessageId);
  };

  const handleEditSave = (userMessageId: string, newText: string) => {
    if (!activeChatId) return;
    editAndResendMessage(activeChatId, userMessageId, newText);
  };

  return (
    <div ref={containerRef} className="h-full overflow-y-auto px-3 py-2">
      {messages.map((msg) => (
        <ChatBubble
          key={msg.id}
          message={msg}
          allMessages={messages}
          chatId={activeChatId}
          isAIGenerating={isAIGenerating}
          onAbort={abortAIGeneration}
          onRegenerate={handleRegenerate}
          onEditSave={handleEditSave}
        />
      ))}
      <div ref={bottomRef} />
    </div>
  );
};

export default ChatMessageList;
