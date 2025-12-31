import React, { useEffect, useRef } from "react";
import ChatBubble from "./ChatBubble";
import ChatInput from "./ChatInput";
import { Message } from "@/features/chatStore";

type ChatWindowProps = {
  messages: Message[];
  sendMessage: (text: string) => Promise<void>;
  sendingMessage: boolean;
};

const ChatWindow: React.FC<ChatWindowProps> = ({
  messages,
  sendMessage,
  sendingMessage,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages]);

  return (
    <div className="h-full w-full flex flex-col">
      <div className="flex-1 overflow-y-auto my-2">
        {messages?.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            Start the conversation by sending a message below
          </div>
        ) : (
          messages.map((message) => (
            <ChatBubble key={message.id} message={message} />
          ))
        )}
        {/* Invisible div to scroll to */}
        <div ref={messagesEndRef} />
      </div>
      <ChatInput onSend={sendMessage} disabled={sendingMessage} />
    </div>
  );
};
export default ChatWindow;
