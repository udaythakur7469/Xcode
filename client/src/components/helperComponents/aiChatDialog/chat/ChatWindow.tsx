"use client";

import React, { useLayoutEffect, useRef } from "react";
import { LogIn, MessageSquare, UserPlus, Link as LinkIcon } from "lucide-react";
import ChatMessageList from "./ChatMessageList";
import ChatInput from "./ChatInput";
import { MoonLoader } from "react-spinners";
import { SharedChatData, SnapshotMessage } from "../ChatContainer";

// ── ReadOnlyBubble ─────────────────────────────────────────────────────────────
// Renders a single snapshot message with the same visual language as ChatBubble
// (blue user, zinc assistant, amber aborted) but with zero store access and no
// action bar (copy / edit / regenerate / feedback).
//
// Why not reuse ChatBubble directly:
// The current ChatBubble calls useChatStore hooks internally (setEditingState,
// setFeedback) and renders BranchNavigator which reads nodeMap from the store.
// In shared mode there is no active chat in the store, so those hooks would
// silently pollute state or throw. ReadOnlyBubble is intentionally minimal.

const ReadOnlyBubble: React.FC<{ msg: SnapshotMessage }> = ({ msg }) => {
  const isUser = msg.role === "user";
  const isAborted = msg.status === "aborted";

  return (
    <div
      className={`flex flex-col mb-3 ${isUser ? "items-end" : "items-start"}`}
    >
      <div
        className={[
          "px-3 py-2 rounded-xl border text-sm leading-relaxed max-w-[70%]",
          isUser
            ? "bg-blue-600 text-white border-blue-500"
            : isAborted
              ? "bg-yellow-950/60 text-zinc-200 border-yellow-600/40"
              : "bg-zinc-800 text-zinc-100 border-zinc-700",
        ].join(" ")}
      >
        <div className="whitespace-pre-wrap break-words">{msg.text}</div>
        {isAborted && !isUser && (
          <div className="mt-1 text-[11px] font-semibold text-yellow-500">
            Generation stopped
          </div>
        )}
        <div
          className={`mt-1 text-[10px] text-right ${
            isUser ? "text-blue-200" : "text-zinc-500"
          }`}
        >
          {new Date(msg.createdAt).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </div>
      </div>
    </div>
  );
};

// ── SharedMessageList ──────────────────────────────────────────────────────────
// Wraps the read-only bubble list with loading/error states and a
// useLayoutEffect that snaps to the bottom before paint (same behaviour as
// ChatMessageList's initial load).

const SharedMessageList: React.FC<{
  data: SharedChatData | null;
  isLoading: boolean;
  error: string | null;
}> = ({ data, isLoading, error }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (data?.messages && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [data?.messages]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <MoonLoader color="#ffffff" size={28} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center p-4 text-sm text-red-400 text-center">
        {error}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div
      ref={containerRef}
      className="h-full overflow-y-auto px-3 py-2"
      style={{ scrollbarWidth: "thin", scrollbarColor: "#52525b transparent" }}
    >
      {data.messages.map((msg) => (
        <ReadOnlyBubble key={msg.id} msg={msg} />
      ))}
    </div>
  );
};

// ── ChatWindow ─────────────────────────────────────────────────────────────────

type ChatWindowProps = {
  activeChatId: string | null;
  isLoading: boolean;
  error: string | null;
  isSendingMessage: boolean;
  isAuthenticated: boolean;
  onSend: (text: string) => void;
  onOpenLogin?: () => void;
  onOpenSignup?: () => void;
  // Shared / presentation mode props — provided by ChatContainerWindow.
  // When isSharedMode is true:
  //   • SharedMessageList renders instead of ChatMessageList
  //   • ChatInput is hidden
  //   • The guest sign-in state is bypassed (CTA is in the sticky footer)
  //   • pb-[60px] padding prevents messages being obscured by the footer
  isSharedMode?: boolean;
  sharedChatData?: SharedChatData | null;
  isLoadingSharedChat?: boolean;
  sharedChatError?: string | null;
  onStartOwnChat?: () => void;
};

const ChatWindow: React.FC<ChatWindowProps> = ({
  activeChatId,
  isLoading,
  error,
  isSendingMessage,
  isAuthenticated,
  onSend,
  onOpenLogin,
  onOpenSignup,
  isSharedMode = false,
  sharedChatData = null,
  isLoadingSharedChat = false,
  sharedChatError = null,
  onStartOwnChat,
}) => {
  // ── Presentation mode ──────────────────────────────────────────────────────
  // Checked BEFORE the guest state so unauthenticated users still see the
  // shared messages (their CTA is in the sticky footer, not here).
  if (isSharedMode) {
    // ── Error empty state ────────────────────────────────────────────────────
    if (!isLoadingSharedChat && sharedChatError) {
      return (
        <div className="h-full w-full flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-xs w-full space-y-4">
            <div className="flex justify-center">
              <div className="p-3 bg-zinc-800 rounded-full">
                <LinkIcon size={22} className="text-zinc-400" />
              </div>
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-bold text-white">
                {sharedChatError.includes("expired")
                  ? "This link has expired"
                  : "Link not found"}
              </h2>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {sharedChatError}
              </p>
            </div>
            <button
              onClick={onStartOwnChat}
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-zinc-700 hover:bg-zinc-600 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              <MessageSquare size={15} />
              Start your own chat
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="h-full w-full flex flex-col">
        <div className="flex-1 overflow-hidden pb-[60px]">
          <SharedMessageList
            data={sharedChatData}
            isLoading={isLoadingSharedChat}
            error={null}
          />
        </div>
      </div>
    );
  }

  // ── Guest state (normal mode) ──────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-xs w-full space-y-4">
          <div className="flex justify-center">
            <div className="p-3 bg-green-600/20 rounded-full">
              <MessageSquare size={22} className="text-green-400" />
            </div>
          </div>

          <div className="space-y-1">
            <h2 className="text-lg font-bold text-white">Sign in to Chat</h2>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Create an account or log in to start AI conversations and save
              your history.
            </p>
          </div>

          <div className="bg-zinc-800/60 rounded-lg p-3 border border-zinc-700 text-left space-y-2">
            {[
              "Unlimited conversations with AI",
              "Save chat history across devices",
              "Personalized context-aware responses",
            ].map((label) => (
              <div key={label} className="flex items-start gap-2">
                <span className="text-green-500 text-xs mt-0.5">✓</span>
                <span className="text-xs text-zinc-300">{label}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={onOpenLogin}
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-green-600 hover:bg-green-500 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              <LogIn size={16} />
              Log In
            </button>
            <button
              onClick={onOpenSignup}
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-zinc-700 hover:bg-zinc-600 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              <UserPlus size={16} />
              Create Account
            </button>
          </div>

          <p className="text-[11px] text-zinc-600">
            By signing up you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    );
  }

  // ── Authenticated — normal mode ────────────────────────────────────────────
  return (
    <div className="h-full w-full flex flex-col">
      <div className="flex-1 overflow-hidden">
        <ChatMessageList
          activeChatId={activeChatId}
          isLoading={isLoading}
          error={error}
        />
      </div>

      <ChatInput
        onSend={onSend}
        disabled={isSendingMessage}
        activeChatId={activeChatId}
      />
    </div>
  );
};

export default ChatWindow;
