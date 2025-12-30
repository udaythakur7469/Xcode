import React from "react";
import ChatBubble from "./ChatBubble";
import ChatInput from "./ChatInput";
import { Message } from "@/features/chatStore";

type ChatWindowProps = {
  messages: Message[];
  sendMessage: (text:string) => Promise<void>;
  sendingMessage  : boolean;
};

const ChatWindow: React.FC<ChatWindowProps> = ({ messages, sendMessage, sendingMessage}) => {
  return (
    <div className="h-full w-full flex flex-col">
      <div className="flex-1 overflow-y-auto my-2">
        {messages?.map((message) => (
          <ChatBubble key={message.id} message={message} />
        ))}
      </div>
      <ChatInput onSend={sendMessage} disabled={sendingMessage} />
    </div>
  );
};
export default ChatWindow;
