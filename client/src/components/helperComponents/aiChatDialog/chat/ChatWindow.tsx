"use client";

import React from "react";
import { LogIn, MessageSquare, UserPlus } from "lucide-react";
import { Message } from "@/features/chatStore";
import ChatMessageList from "./ChatMessageList";
import ChatInput from "./ChatInput";

type ChatWindowProps = {
  messages: Message[];
  activeChatId: string | null;
  isLoading: boolean;
  error: string | null;
  isSendingMessage: boolean;
  isAuthenticated: boolean;
  onSend: (text: string) => void;
  onOpenLogin?: () => void;
  onOpenSignup?: () => void;
};

const ChatWindow: React.FC<ChatWindowProps> = ({
  messages,
  activeChatId,
  isLoading,
  error,
  isSendingMessage,
  isAuthenticated,
  onSend,
  onOpenLogin,
  onOpenSignup,
}) => {
  // ── Guest state ───────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-xs w-full space-y-4">
          <div className="flex justify-center">
            <div className="p-3 bg-blue-600/20 rounded-full">
              <MessageSquare size={22} className="text-blue-400" />
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
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-colors"
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

  // ── Authenticated ─────────────────────────────
  return (
    <div className="h-full w-full flex flex-col">
      <div className="flex-1 overflow-hidden">
        <ChatMessageList
          messages={messages}
          activeChatId={activeChatId}
          isLoading={isLoading}
          error={error}
        />
      </div>

      {/* activeChatId passed so ChatInput can seed/persist its draft per chat */}
      <ChatInput
        onSend={onSend}
        disabled={isSendingMessage}
        activeChatId={activeChatId}
      />
    </div>
  );
};

export default ChatWindow;
