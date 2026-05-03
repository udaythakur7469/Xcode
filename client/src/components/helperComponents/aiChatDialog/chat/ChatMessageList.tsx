"use client";

import React, { useLayoutEffect, useRef } from "react";
import { useChatStore, selectVisibleMessages } from "@/features/chatStore";
import ChatBubble from "./ChatBubble";
import { ChatMessageListSkeleton } from "./ChatMessageListSkeleton";

type ChatMessageListProps = {
  activeChatId: string | null;
  isLoading: boolean;
  error: string | null;
};

const ChatMessageList: React.FC<ChatMessageListProps> = ({
  activeChatId,
  isLoading,
  error,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isInitialLoad = useRef(true);

  // Subscribe to the flat visible message list derived from activePath + nodeMap
  const messages = useChatStore(selectVisibleMessages);
  const isActivePathGenerating = useChatStore((s) => s.isActivePathGenerating);
  const createRegenerateBranch = useChatStore((s) => s.createRegenerateBranch);
  const createEditBranch = useChatStore((s) => s.createEditBranch);

  // Reset initial-load flag whenever the active chat changes
  useLayoutEffect(() => {
    isInitialLoad.current = true;
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [activeChatId]);

  // Snap to bottom before paint on initial load (WhatsApp-like behavior)
  useLayoutEffect(() => {
    if (messages.length === 0) return;

    if (isInitialLoad.current) {
      isInitialLoad.current = false;

      const container = containerRef.current;
      if (!container) return;

      // First attempt — synchronous snap before paint
      container.scrollTop = container.scrollHeight;

      // Second attempt — after all child heights are resolved
      // MutationObserver catches dynamic content (markdown, code blocks)
      // that finishes rendering after the initial layout pass
      const observer = new MutationObserver(() => {
        container.scrollTop = container.scrollHeight;
      });

      observer.observe(container, { childList: true, subtree: true });

      // Stop observing after 500ms — by then everything has painted
      const timeout = setTimeout(() => observer.disconnect(), 500);

      return () => {
        clearTimeout(timeout);
        observer.disconnect();
      };
    }

    // New message after initial load — smooth scroll
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
    return <ChatMessageListSkeleton />;
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
    createRegenerateBranch(activeChatId, userMessageId);
  };

  const handleEditSave = (userMessageId: string, newText: string) => {
    if (!activeChatId) return;
    createEditBranch(activeChatId, userMessageId, newText);
  };

  return (
    <div ref={containerRef} className="h-full overflow-y-auto px-3 py-2">
      {messages.map((msg) => (
        <ChatBubble
          key={msg.id}
          message={msg}
          isActivePathGenerating={isActivePathGenerating}
          onRegenerate={handleRegenerate}
          onEditSave={handleEditSave}
          chatId={activeChatId}
        />
      ))}
      <div ref={bottomRef} />
    </div>
  );
};

export default ChatMessageList;
