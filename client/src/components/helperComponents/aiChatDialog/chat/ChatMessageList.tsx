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

  const revealTarget = useChatStore((s) => s.revealTarget);
  const clearRevealTarget = useChatStore((s) => s.clearRevealTarget);

  // True while a search result is being revealed in this chat. While true,
  // every "snap / scroll to bottom" behaviour below stands down so it can't
  // fight the scroll-to-message logic.
  const isRevealPending = () => {
    const t = useChatStore.getState().revealTarget;
    return !!t && t.chatId === activeChatId;
  };

  // Reset initial-load flag whenever the active chat changes
  useLayoutEffect(() => {
    isInitialLoad.current = true;
    if (containerRef.current && !isRevealPending()) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [activeChatId]);

  // Snap to bottom before paint on initial load (WhatsApp-like behavior)
  useLayoutEffect(() => {
    if (messages.length === 0) return;

    if (isInitialLoad.current) {
      isInitialLoad.current = false;

      // Opened via search result → the reveal effect below positions the
      // scroll on the target message; don't snap to the bottom.
      if (isRevealPending()) return;

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
    if (isRevealPending()) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  // ── Reveal a message chosen from Text Search / Node Search ───────────────
  // Scrolls the target bubble to the vertical centre of the list and flashes
  // it. Layout can still shift for a moment after first paint (markdown, code
  // blocks), so we re-centre on DOM mutations for a short window — but stop
  // the instant the user scrolls/touches, so we never fight them.
  useLayoutEffect(() => {
    if (!revealTarget || revealTarget.chatId !== activeChatId) return;
    const container = containerRef.current;
    if (!container) return;

    const selector = `[data-message-id="${CSS.escape(revealTarget.messageId)}"]`;
    const target = container.querySelector<HTMLElement>(selector);
    if (!target) return; // path not rebuilt yet — effect re-runs when messages change

    const centre = () => {
      const c = container.getBoundingClientRect();
      const t = target.getBoundingClientRect();
      const delta = t.top - c.top - (c.height / 2 - t.height / 2);
      // Very tall message: align its top a little below the container top
      // instead of centring (centring would cut off the beginning).
      const tooTall = t.height > c.height * 0.8;
      container.scrollTop += tooTall ? t.top - c.top - 16 : delta;
    };
    centre();

    // Highlight ONLY the bubble's own border — `target` is the full-width
    // row wrapper, so animating it would light up the whole horizontal strip.
    const bubble = target.querySelector<HTMLElement>("[data-message-bubble]") ?? target;
    bubble.animate(
      [
        { boxShadow: "0 0 0 0 rgba(34,197,94,0)" },
        { boxShadow: "0 0 0 2px rgba(34,197,94,.9)", offset: 0.2 },
        { boxShadow: "0 0 0 2px rgba(34,197,94,.9)", offset: 0.65 },
        { boxShadow: "0 0 0 0 rgba(34,197,94,0)" },
      ],
      { duration: 1800, easing: "ease-out" },
    );

    let userTookOver = false;
    const stop = () => {
      userTookOver = true;
      observer.disconnect();
    };
    const observer = new MutationObserver(() => {
      if (!userTookOver) centre();
    });
    observer.observe(container, { childList: true, subtree: true });
    container.addEventListener("wheel", stop, { passive: true, once: true });
    container.addEventListener("touchstart", stop, { passive: true, once: true });
    container.addEventListener("mousedown", stop, { once: true });

    const settle = setTimeout(() => {
      observer.disconnect();
      clearRevealTarget(revealTarget.nonce);
    }, 700);

    return () => {
      clearTimeout(settle);
      observer.disconnect();
      container.removeEventListener("wheel", stop);
      container.removeEventListener("touchstart", stop);
      container.removeEventListener("mousedown", stop);
    };
  }, [revealTarget, activeChatId, messages, isLoading, clearRevealTarget]);

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
    <div
      ref={containerRef}
      className="h-full overflow-y-auto px-3 py-2"
      style={{ overscrollBehavior: "contain" }}
    >
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
