import React, { useEffect, useRef } from "react";
import ChatBubble from "./ChatBubble";
import ChatInput from "./ChatInput";
import { Message } from "@/features/chatStore";
import { MoonLoader } from "react-spinners";

type ChatWindowProps = {
  messages: Message[];
  sendMessage: (text: string) => Promise<void>;
  sendingMessage: boolean;
  gettingMessage: boolean;
  gettingMessagesError: string | null;
  activeChatId: string | null;
};

const ChatWindow: React.FC<ChatWindowProps> = ({
  messages,
  sendMessage,
  sendingMessage,
  gettingMessage,
  gettingMessagesError,
  activeChatId,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages]);

  // ✅ FIX: Strict Message Ownership Rule
  // Only render messages when we have a valid active chat
  const shouldRenderMessages = activeChatId !== null && messages.length > 0;

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
          // ✅ No active chat selected
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            Select a chat or create a new one to start messaging
          </div>
        ) : !shouldRenderMessages ? (
          // ✅ Active chat exists but no messages yet
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            Start the conversation by sending a message below
          </div>
        ) : (
          // ✅ Render messages only when ownership is valid
          messages.map((message) => (
            <ChatBubble key={message.id} message={message} />
          ))
        )}
        {/* Invisible div to scroll to */}
        <div ref={messagesEndRef} />
      </div>
      <ChatInput
        onSend={sendMessage}
        disabled={sendingMessage}
      />
    </div>
  );
};

export default ChatWindow;
