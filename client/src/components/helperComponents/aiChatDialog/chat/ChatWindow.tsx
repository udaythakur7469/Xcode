import React, { useEffect, useRef } from "react";
import ChatBubble from "./ChatBubble";
import ChatInput from "./ChatInput";
import { Message, useChatStore } from "@/features/chatStore";
import { MoonLoader } from "react-spinners";
import { useUserStore } from "@/features/userStore";
import { MessageSquare, LogIn, UserPlus } from "lucide-react";

type ChatWindowProps = {
  messages: Message[];
  sendMessage: (text: string) => Promise<void>;
  sendingMessage: boolean;
  gettingMessage: boolean;
  gettingMessagesError: string | null;
  activeChatId: string | null;
  onOpenLogin?: () => void;
  onOpenSignup?: () => void;
};

const ChatWindow: React.FC<ChatWindowProps> = ({
  messages,
  sendMessage,
  sendingMessage,
  gettingMessage,
  gettingMessagesError,
  activeChatId,
  onOpenLogin,
  onOpenSignup,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get abort function and generating state from store
  const { abortAIGeneration, isAIGenerating } = useChatStore();

  // ✅ Check if user is authenticated
  const { isUserAuthenticated } = useUserStore();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages]);

  // Only render messages when we have a valid active chat
  const shouldRenderMessages = activeChatId !== null && messages.length > 0;

  // ✅ Guest User Prompt
  if (!isUserAuthenticated) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center p-4 text-center overflow-y-auto">
        <div className="max-w-sm w-full space-y-4">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="p-3 bg-blue-600/20 rounded-full">
              <MessageSquare size={24} className="text-blue-500" />
            </div>
          </div>

          {/* Heading */}
          <div className="space-y-1.5">
            <h2 className="text-xl font-bold text-white">
              Sign in to Chat with AI
            </h2>
            <p className="text-sm text-gray-400">
              Create an account or log in to start conversations with our AI
              assistant and save your chat history.
            </p>
          </div>

          {/* Benefits */}
          <div className="space-y-2 text-left bg-zinc-800/50 rounded-lg p-3 border border-zinc-700">
            <div className="flex items-start gap-2">
              <div className="text-green-500 mt-0.5 text-sm">✓</div>
              <div className="text-xs text-gray-300">
                <span className="font-semibold">Unlimited conversations</span>{" "}
                with advanced AI
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="text-green-500 mt-0.5 text-sm">✓</div>
              <div className="text-xs text-gray-300">
                <span className="font-semibold">Save chat history</span> across
                all your devices
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="text-green-500 mt-0.5 text-sm">✓</div>
              <div className="text-xs text-gray-300">
                <span className="font-semibold">Personalized responses</span>{" "}
                that remember context
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2.5">
            <button
              onClick={onOpenLogin}
              className="flex items-center justify-center gap-2 w-full px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              <LogIn size={18} />
              Log In
            </button>
            <button
              onClick={onOpenSignup}
              className="flex items-center justify-center gap-2 w-full px-5 py-2.5 bg-zinc-700 hover:bg-zinc-600 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              <UserPlus size={18} />
              Create Account
            </button>
          </div>

          {/* Footer Note */}
          <p className="text-xs text-gray-500 leading-relaxed">
            By signing up, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    );
  }

  // ✅ Authenticated User - Normal Chat Interface
  return (
    <div className="h-full w-full flex flex-col">
      <div className="flex-1 overflow-y-auto my-2">
        {gettingMessagesError ? (
          <div className="flex h-full justify-center items-center p-4 text-red-500 text-sm">
            {gettingMessagesError}
          </div>
        ) : gettingMessage ? (
          <div className="flex h-full justify-center items-center p-4 text-gray-400 text-sm">
            <MoonLoader color="#ffffff" />
          </div>
        ) : !activeChatId ? (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            Select a chat or create a new one to start messaging
          </div>
        ) : !shouldRenderMessages ? (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            Start the conversation by sending a message below
          </div>
        ) : (
          messages.map((message) => (
            <ChatBubble
              key={message.id}
              message={message}
              onAbort={abortAIGeneration}
              isAIGenerating={isAIGenerating}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      <ChatInput onSend={sendMessage} disabled={sendingMessage} />
    </div>
  );
};

export default ChatWindow;
