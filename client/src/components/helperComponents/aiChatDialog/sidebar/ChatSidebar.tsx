"use client";

import React from "react";
import { MessageCirclePlus, Share2, Trash2 } from "lucide-react";
import { getChatsResponse } from "@/features/chatStore";
import { MoonLoader } from "react-spinners";
import { ChatSidebarSkeleton } from "./ChatSidebarSkeleton";

type ChatSidebarProps = {
  chats?: getChatsResponse[];
  activeChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
  isLoading?: boolean;
  onDeleteChat: (chatId: string) => void;
  // New prop: called when the share icon is clicked on the active chat row.
  onShareChat: (chatId: string) => void;
  isSharingChat: boolean;
  gettingChatsError: string | null;
};

const ChatSidebar: React.FC<ChatSidebarProps> = ({
  chats,
  activeChatId,
  onSelectChat,
  onNewChat,
  isLoading = false,
  onDeleteChat,
  onShareChat,
  isSharingChat=false,
  gettingChatsError,
}) => {
  return (
    <div className="h-full w-full flex flex-col">
      <div
        className="flex flex-row items-center justify-center gap-x-3 text-lg border rounded-2xl p-2 my-2 mx-10 bg-green-600 cursor-pointer select-none"
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
          <ChatSidebarSkeleton />
        ) : chats?.length === 0 ? (
          <div className="p-4 text-center text-gray-400 text-sm">
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
                  activeChatId === chat.id ? "bg-green-600" : "hover:bg-zinc-600"
                }
              `}
            >
              <div className="truncate flex-1" title={chat.title}>
                {chat.title || "New Chat"}
              </div>

              {/* Share + Delete — only visible on the active chat row */}
              {activeChatId === chat.id ? (
                <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                  {/* Share icon — left of delete, stopPropagation prevents
                      the parent onClick from also triggering onSelectChat */}

                  {isSharingChat ? (
                    <MoonLoader size={15} color="#ffffff" />
                  ) : (
                    <Share2
                      size={15}
                      onClick={(e) => {
                        e.stopPropagation();
                        onShareChat(chat.id);
                      }}
                      className="hover:text-green-300 transition-colors cursor-pointer"
                      title="Share this chat"
                    />
                  )}
                  <Trash2
                    size={15}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteChat(chat.id);
                    }}
                    className="hover:text-red-500 transition-colors cursor-pointer"
                    title="Delete this chat"
                  />
                </div>
              ) : null}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ChatSidebar;
