"use client";

import React, { useEffect } from "react";
import { MessageCirclePlus, Trash2 } from "lucide-react";
import { getChatsResponse } from "@/features/chatStore";
import { MoonLoader } from "react-spinners";

type ChatSidebarProps = {
  chats?: getChatsResponse[];
  activeChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
  isLoading?: boolean;
  onDeleteChat: (chatId: string) => void;
  gettingChatsError : string | null;
};

const ChatSidebar: React.FC<ChatSidebarProps> = ({
  chats,
  activeChatId,
  onSelectChat,
  onNewChat,
  isLoading = false,
  onDeleteChat,
  gettingChatsError,
}) => {
  // In ChatSidebar
  useEffect(() => {
    console.log("📊 ChatSidebar received chats:", chats);
  }, [chats]);
  return (
    <div className="h-full w-full flex flex-col">
      <div
        className="flex flex-row items-center justify-center gap-x-3 text-lg border rounded-2xl p-2 my-2 mx-10 bg-blue-600 cursor-pointer select-none"
        onClick={onNewChat}
      >
        <MessageCirclePlus />
        New Chat
      </div>
      {/* Chat List */}
      <div className="flex-1 overflow-y-auto px-2">
        {gettingChatsError ? (
          <div className="flex h-full justify-center items-center break-words text-red-500 text-sm">
            {gettingChatsError}
          </div>
        ) : isLoading ? (
          <div className="flex h-full justify-center items-center">
            <MoonLoader color="#ffffff" />
          </div>
        ) : chats?.length === 0 ? (
          <div className="flex h-full justify-center pb-10 items-center text-gray-400 text-sm">
            No chats yet
          </div>
        ) : (
          chats?.map((chat) => (
            <div
              key={chat.id}
              onClick={() => onSelectChat(chat.id)}
              className={`
                p-3
                my-2
                rounded-lg
                cursor-pointer
                text-sm
                transition-colors
                border
                flex flex-row items-center justify-between
                ${
                  activeChatId === chat.id ? "bg-blue-700" : "hover:bg-zinc-600"
                }
              `}
            >
              <div className="truncate flex-1" title={chat.title}>
                {chat.title || "New Chat"}
              </div>
              {activeChatId === chat.id ? (
                <Trash2 size={16} onClick={() => onDeleteChat(activeChatId)} />
              ) : null}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
export default ChatSidebar;
