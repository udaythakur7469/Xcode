"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useChatStore } from "@/features/chatStore";
import { useUserStore } from "@/features/userStore";
import ChatSidebar from "./sidebar/ChatSidebar";
import ChatWindow from "./chat/ChatWindow";

// ─────────────────────────────────────────────────────────────────────────────
// ChatContainerSidebar
// Owns all sidebar orchestration: load, reset, auto-select, chat-switch guard.
// ─────────────────────────────────────────────────────────────────────────────

type SidebarProps = {
  isDialogOpen: boolean;
  setDialogOpen: (open: boolean) => void;
};

export const ChatContainerSidebar: React.FC<SidebarProps> = ({
  isDialogOpen,
  setDialogOpen,
}) => {
  const { isUserAuthenticated } = useUserStore();

  const userChats = useChatStore((s) => s.userChats);
  const activeChatId = useChatStore((s) => s.activeChatId);
  const isLoadingUserChats = useChatStore((s) => s.isLoadingUserChats);
  const UserChatsError = useChatStore((s) => s.UserChatsError);
  const editingState = useChatStore((s) => s.editingState);

  const getUserChats = useChatStore((s) => s.getUserChats);
  const setActiveChatId = useChatStore((s) => s.setActiveChatId);
  const getChatMessages = useChatStore((s) => s.getChatMessages);
  const createChat = useChatStore((s) => s.createChat);
  const deleteChat = useChatStore((s) => s.deleteChat);
  const resetStore = useChatStore((s) => s.resetStore);
  const setEditingState = useChatStore((s) => s.setEditingState);

  const prevOpen = useRef(false);

  // ── Unsaved edit guard ─────────────────────────────────────────────────────
  const [unsavedAlertOpen, setUnsavedAlertOpen] = useState(false);
  const pendingNavigation = useRef<
    { type: "switchChat"; chatId: string } | { type: "closeDialog" } | null
  >(null);

  const checkUnsavedEdit = useCallback(
    (
      navigation:
        | { type: "switchChat"; chatId: string }
        | { type: "closeDialog" },
    ): boolean => {
      if (!editingState) return true;
      pendingNavigation.current = navigation;
      setUnsavedAlertOpen(true);
      return false;
    },
    [editingState],
  );

  const handleUnsavedContinue = () => {
    setUnsavedAlertOpen(false);
    pendingNavigation.current = null;
  };

  const handleUnsavedExit = () => {
    setUnsavedAlertOpen(false);
    const nav = pendingNavigation.current;
    pendingNavigation.current = null;

    // Clear editingState — ChatBubble watches this and exits edit mode
    setEditingState(null);

    if (!nav) return;

    if (nav.type === "switchChat") {
      performChatSwitch(nav.chatId);
    } else if (nav.type === "closeDialog") {
      resetStore();
      setDialogOpen(false);
    }
  };

  // ── Load chats when dialog opens ───────────────────────────────────────────
  useEffect(() => {
    const justOpened = isDialogOpen && !prevOpen.current;
    if (justOpened) {
      if (isUserAuthenticated) {
        getUserChats();
      } else {
        resetStore();
      }
    }
    prevOpen.current = isDialogOpen;
  }, [isDialogOpen, isUserAuthenticated, getUserChats, resetStore]);

  // ── Clear store when dialog closes ─────────────────────────────────────────
  useEffect(() => {
    if (!isDialogOpen) {
      const t = setTimeout(() => {
        setEditingState(null);
        resetStore();
      }, 300);
      return () => clearTimeout(t);
    }
  }, [isDialogOpen, resetStore, setEditingState]);

  // ── Auto-select first real chat ────────────────────────────────────────────
  useEffect(() => {
    if (
      isDialogOpen &&
      isUserAuthenticated &&
      userChats.length > 0 &&
      !activeChatId &&
      !isLoadingUserChats
    ) {
      const first = userChats[0];
      if (!first.id.startsWith("temp-")) {
        setActiveChatId(first.id);
        getChatMessages(first.id);
      }
    }
  }, [
    isDialogOpen,
    isUserAuthenticated,
    userChats,
    activeChatId,
    isLoadingUserChats,
    setActiveChatId,
    getChatMessages,
  ]);

  if (!isUserAuthenticated) return null;

  // ── Chat switch ─────────────────────────────────────────────────────────────
  const performChatSwitch = async (chatId: string) => {
    setActiveChatId(chatId);
    await getChatMessages(chatId);
  };

  const handleNewChat = async () => {
    try {
      const id = await createChat();
      if (id) {
        setActiveChatId(id);
        if (!id.startsWith("temp-")) {
          await getChatMessages(id);
        }
      }
    } catch {}
  };

  const handleSelectChat = (chatId: string) => {
    if (chatId === activeChatId) return;
    if (!checkUnsavedEdit({ type: "switchChat", chatId })) return;
    performChatSwitch(chatId);
  };

  const handleDeleteChat = async (chatId: string) => {
    const isActive = chatId === activeChatId;
    const idx = userChats.findIndex((c) => c.id === chatId);

    try {
      await deleteChat(chatId);

      if (isActive) {
        await new Promise((r) => setTimeout(r, 0));
        const { userChats: updated } = useChatStore.getState();

        if (updated.length > 0) {
          const next = updated[Math.min(idx, updated.length - 1)];
          setActiveChatId(next.id);
          if (!next.id.startsWith("temp-")) {
            await getChatMessages(next.id);
          }
        } else {
          setActiveChatId(null);
        }
      }
    } catch {}
  };

  return (
    <>
      <ChatSidebar
        chats={userChats}
        activeChatId={activeChatId}
        isLoading={isLoadingUserChats}
        gettingChatsError={UserChatsError}
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        onDeleteChat={handleDeleteChat}
      />

      {/* Unsaved changes dialog — triggered when switching chats/closing mid-edit */}
      <AlertDialog open={unsavedAlertOpen} onOpenChange={setUnsavedAlertOpen}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-700 text-white z-[10001]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              You have unsaved changes
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Your edits to this message will be lost if you leave now.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={handleUnsavedContinue}
              className="bg-zinc-800 border-zinc-600 text-zinc-300 hover:bg-zinc-700 hover:text-white"
            >
              Continue editing
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnsavedExit}
              className="bg-red-600 hover:bg-red-500 text-white border-transparent"
            >
              Exit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// ChatContainerWindow
// Owns message send orchestration.
// ─────────────────────────────────────────────────────────────────────────────

type WindowProps = {
  onOpenLogin: () => void;
  onOpenSignup: () => void;
};

export const ChatContainerWindow: React.FC<WindowProps> = ({
  onOpenLogin,
  onOpenSignup,
}) => {
  const { isUserAuthenticated } = useUserStore();

  const activeChatId = useChatStore((s) => s.activeChatId);
  const isSendingMessage = useChatStore((s) => s.isSendingMessage);
  const isGettingChatMessages = useChatStore((s) => s.isGettingChatMessages);
  const chatMessagesError = useChatStore((s) => s.chatMessagesError);
  const nodeMap = useChatStore((s) => s.nodeMap);

  const sendMessage = useChatStore((s) => s.sendMessage);
  const createChat = useChatStore((s) => s.createChat);
  const getChatMessages = useChatStore((s) => s.getChatMessages);
  const getUserChats = useChatStore((s) => s.getUserChats);
  const moveChatToTop = useChatStore((s) => s.moveChatToTop);
  const setActiveChatId = useChatStore((s) => s.setActiveChatId);
  const clearInputDraft = useChatStore((s) => s.clearInputDraft);

  const handleSend = async (text: string) => {
    if (!isUserAuthenticated) return;

    if (!activeChatId) {
      try {
        const newId = await createChat();
        if (!newId) return;
        setActiveChatId(newId);
        await sendMessage(newId, text);
        await getUserChats();
      } catch {}
      return;
    }

    try {
      // isFirst = no messages loaded yet in this chat
      const isFirst = Object.keys(nodeMap).length === 0;
      moveChatToTop(activeChatId);
      clearInputDraft(activeChatId);
      await sendMessage(activeChatId, text);

      if (isFirst) {
        await getUserChats();
        moveChatToTop(activeChatId);
      }
    } catch {}
  };

  return (
    <ChatWindow
      activeChatId={activeChatId}
      isLoading={isGettingChatMessages}
      error={chatMessagesError}
      isSendingMessage={isSendingMessage}
      isAuthenticated={isUserAuthenticated}
      onSend={handleSend}
      onOpenLogin={onOpenLogin}
      onOpenSignup={onOpenSignup}
    />
  );
};
