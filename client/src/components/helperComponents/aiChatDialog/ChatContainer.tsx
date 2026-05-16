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
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { GitFork, Loader2, LogIn } from "lucide-react";
import { SnapshotMessage, SharedChatData } from "@/features/chatStore";
import ChatShareDialog from "./chat/ChatShareDialog";
export type { SnapshotMessage, SharedChatData };

// ─────────────────────────────────────────────────────────────────────────────
// ChatContainerSidebar
// Owns all sidebar orchestration: load, reset, auto-select, chat-switch guard,
// share action, and the normal chat list in non-shared mode.
// In shared mode the sidebar is visually collapsed to 0 width by FloatingDialog
// (forceSidebarClosed), but this component stays mounted so it can render
// ChatSidebar for when the user forks and shared mode exits.
// ─────────────────────────────────────────────────────────────────────────────

type SidebarProps = {
  isDialogOpen: boolean;
  setDialogOpen: (open: boolean) => void;
  // Called by the sticky footer "Sign in to continue this chat" button.
  // Receives the current shareId so sessionStorage can be set BEFORE
  // the dialog closes and login opens.
  onOpenLoginForSharedChat: (shareId: string) => void;
};

export const ChatContainerSidebar: React.FC<SidebarProps> = ({
  isDialogOpen,
  setDialogOpen,
  onOpenLoginForSharedChat,
}) => {
  const { isUserAuthenticated } = useUserStore();
  const searchParams = useSearchParams();

  const [openSharePostDialog, setOpenSharePostDialog] =
    useState<boolean>(false);
  const [shareUrl, setShareUrl] = useState<string | null>("");

  const userChats = useChatStore((s) => s.userChats);
  const activeChatId = useChatStore((s) => s.activeChatId);
  const isLoadingUserChats = useChatStore((s) => s.isLoadingUserChats);
  const UserChatsError = useChatStore((s) => s.UserChatsError);
  const editingState = useChatStore((s) => s.editingState);
  const forkSharedChat = useChatStore((s) => s.forkSharedChat);

  const getUserChats = useChatStore((s) => s.getUserChats);
  const setActiveChatId = useChatStore((s) => s.setActiveChatId);
  const getChatMessages = useChatStore((s) => s.getChatMessages);
  const createChat = useChatStore((s) => s.createChat);
  const deleteChat = useChatStore((s) => s.deleteChat);
  const resetStore = useChatStore((s) => s.resetStore);
  const setEditingState = useChatStore((s) => s.setEditingState);
  const moveChatToTop = useChatStore((s) => s.moveChatToTop);

  const prevOpen = useRef(false);

  const shareIdFromUrl = searchParams.get("sharedChat");
  const isSharedMode = shareIdFromUrl !== null;

  // ── Share active chat ──────────────────────────────────────────────────────
  // Called by the share icon in ChatSidebar on the active chat row.
  const { shareChat, isSharingChat } = useChatStore();

  const handleShareChat = async (chatId: string) => {
    try {
      const url = await shareChat(chatId);
      setShareUrl(url);
      setOpenSharePostDialog(true);
    } catch (err: any) {
      const errMsg =
        err?.response?.data?.error?.message ||
        "Failed to share chat — please try again";
      toast.error(errMsg);
    }
  };

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
    setEditingState(null);
    if (!nav) return;
    if (nav.type === "switchChat") performChatSwitch(nav.chatId);
    else if (nav.type === "closeDialog") {
      resetStore();
      setDialogOpen(false);
    }
  };

  // ── Load chats when dialog opens ───────────────────────────────────────────
  useEffect(() => {
    const justOpened = isDialogOpen && !prevOpen.current;
    if (justOpened) {
      if (isUserAuthenticated) getUserChats();
      else resetStore();
    }
    prevOpen.current = isDialogOpen;
  }, [isDialogOpen, isUserAuthenticated, getUserChats, resetStore]);

  // ── Clear store when dialog closes ────────────────────────────────────────
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
  // Guarded by !isSharedMode so opening in shared mode never clobbers
  // the presentation view by immediately switching to the user's first chat.
  useEffect(() => {
    if (
      isDialogOpen &&
      isUserAuthenticated &&
      userChats.length > 0 &&
      !activeChatId &&
      !isLoadingUserChats &&
      !isSharedMode
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
    isSharedMode,
    setActiveChatId,
    getChatMessages,
  ]);

  // Unauthenticated users with no shared mode get no sidebar
  if (!isUserAuthenticated && !isSharedMode) return null;

  // ── Chat switch ────────────────────────────────────────────────────────────
  const performChatSwitch = async (chatId: string) => {
    setActiveChatId(chatId);
    await getChatMessages(chatId);
  };

  const handleNewChat = async () => {
    try {
      const id = await createChat();
      if (id) {
        setActiveChatId(id);
        if (!id.startsWith("temp-")) await getChatMessages(id);
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
          if (!next.id.startsWith("temp-")) await getChatMessages(next.id);
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
        onShareChat={handleShareChat}
        isSharingChat={isSharingChat}
      />

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
      <ChatShareDialog
        isOpen={openSharePostDialog}
        onClose={() => setOpenSharePostDialog(false)}
        shareUrl={shareUrl}
        chatId={activeChatId}
      />
    </>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SharedChatFooter
// Sticky footer rendered inside ChatContainerWindow (position: absolute,
// bottom: 0) when in shared/presentation mode.
// Shows "Continue this chat" for authenticated users and
// "Sign in to continue this chat" for guests.
// Hidden while the snapshot is still loading or if there's a fetch error.
// ─────────────────────────────────────────────────────────────────────────────

type SharedChatFooterProps = {
  isAuthenticated: boolean;
  isForking: boolean;
  isLoadingSharedChat: boolean;
  sharedChatError: string | null;
  shareIdFromUrl: string;
  onFork: () => void;
  onOpenLogin: () => void;
  alreadyExistsChatId: string | null;
  onOpenExisting: () => void;
};

export const SharedChatFooter: React.FC<SharedChatFooterProps> = ({
  isAuthenticated,
  isForking,
  isLoadingSharedChat,
  sharedChatError,
  shareIdFromUrl,
  onFork,
  onOpenLogin,
  alreadyExistsChatId,
  onOpenExisting,
}) => {
  if (isLoadingSharedChat || sharedChatError) return null;

  // ── Already exists banner ──────────────────────────────────────────────────
  if (alreadyExistsChatId) {
    return (
      <div className="absolute bottom-0 left-0 right-0 z-30 border-t border-amber-500/30 bg-amber-950/60 backdrop-blur-sm px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="shrink-0 w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
            <GitFork size={15} className="text-amber-400" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-amber-300 leading-tight">
              You already have this conversation
            </p>
            <p className="text-xs text-amber-500/80 mt-0.5">
              This chat exists in your history — open it instead of creating a
              duplicate.
            </p>
          </div>
        </div>
        <button
          onClick={onOpenExisting}
          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-amber-950 text-xs font-bold transition-colors"
        >
          Open existing
        </button>
      </div>
    );
  }

  // ── Normal footer ──────────────────────────────────────────────────────────
  return (
    <div className="absolute bottom-0 left-0 right-0 z-30 border-t bg-background px-4 py-3 flex items-center justify-between gap-3 shadow-[0_-4px_16px_rgba(0,0,0,0.12)]">
      <div className="min-w-0">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Shared Conversation
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">
          {isAuthenticated
            ? "Fork this conversation to continue chatting"
            : "Sign in to continue this conversation"}
        </p>
      </div>

      {isAuthenticated ? (
        <button
          onClick={onFork}
          disabled={isForking}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold shrink-0 hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isForking ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Creating copy…
            </>
          ) : (
            <>
              <GitFork size={14} />
              Continue this chat
            </>
          )}
        </button>
      ) : (
        <button
          onClick={onOpenLogin}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold shrink-0 hover:opacity-90 transition-opacity"
        >
          <LogIn size={14} />
          Sign in to continue this chat
        </button>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// ChatContainerWindow
// Wraps ChatWindow and, when in shared mode, fetches the snapshot and mounts
// SharedChatFooter. The wrapper div uses position:relative so the footer's
// absolute positioning is scoped to this container (inside the dialog).
// ─────────────────────────────────────────────────────────────────────────────

type WindowProps = {
  onOpenLogin: () => void;
  onOpenSignup: () => void;
  // Passed from FloatingActionButtons — saves shareId to sessionStorage
  // before closing the dialog and opening the login form.
  onOpenLoginForSharedChat: (shareId: string) => void;
};

export const ChatContainerWindow: React.FC<WindowProps> = ({
  onOpenLogin,
  onOpenSignup,
  onOpenLoginForSharedChat,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
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

  // ── Shared mode state ──────────────────────────────────────────────────────
  // ChatContainerWindow owns its own fetch of the shared snapshot so it can
  // pass the data directly to ChatWindow and SharedChatFooter.
  // Local useState is used (not the chat store) to avoid overwriting
  // nodeMap / chatMessage which drives the live chat window.
  const shareIdFromUrl = searchParams.get("sharedChat");
  const isSharedMode = shareIdFromUrl !== null;

  const sharedChatData = useChatStore((s) => s.sharedChatData);
  const isLoadingSharedChat = useChatStore((s) => s.isLoadingSharedChat);
  const sharedChatError = useChatStore((s) => s.sharedChatError);
  const isForking = useChatStore((s) => s.isForking);
  const getSharedChat = useChatStore((s) => s.getSharedChat);
  const forkSharedChat = useChatStore((s) => s.forkSharedChat);
  const clearSharedChat = useChatStore((s) => s.clearSharedChat);

  const [alreadyExistsChat, setAlreadyExistsChat] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (!shareIdFromUrl) {
      clearSharedChat();
      return;
    }
    getSharedChat(shareIdFromUrl);
  }, [shareIdFromUrl]);

  // ── Fork ───────────────────────────────────────────────────────────────────
  const handleFork = async () => {
    if (!shareIdFromUrl || isForking) return;
    setAlreadyExistsChat(null);
    try {
      const newChatId = await forkSharedChat(shareIdFromUrl);
      if (!newChatId) return;

      const params = new URLSearchParams(searchParams.toString());
      params.delete("sharedChat");
      const newSearch = params.toString();
      router.replace(newSearch ? `?${newSearch}` : window.location.pathname);

      await getUserChats();
      moveChatToTop(newChatId);
      setActiveChatId(newChatId);
      await getChatMessages(newChatId);

      toast.success("Chat added to your conversations");
    } catch (err: any) {
      if (err.alreadyForked && err.existingChatId) {
        setAlreadyExistsChat(err.existingChatId); // ← show banner, don't clear shared mode
      } else {
        toast.error(err?.message ?? "Failed to fork chat — please try again");
      }
    }
  };

  // ── Login handler for the sticky footer CTA ────────────────────────────────
  // Mirror of openLoginForSharedChat in FloatingActionButtons.
  // Both save to sessionStorage — whichever one fires first wins.
  const handleOpenLoginForFork = () => {
    if (shareIdFromUrl) {
      onOpenLoginForSharedChat(shareIdFromUrl);
    } else {
      onOpenLogin();
    }
  };

  // ── Normal send ────────────────────────────────────────────────────────────
  const handleSend = async (text: string) => {
    if (!isUserAuthenticated || isSharedMode) return;

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
    // position:relative so the absolute-positioned SharedChatFooter
    // anchors to this container, not the viewport.
    <div className="relative h-full w-full flex flex-col overflow-hidden">
      <ChatWindow
        activeChatId={activeChatId}
        isLoading={isGettingChatMessages}
        error={chatMessagesError}
        isSendingMessage={isSendingMessage}
        isAuthenticated={isUserAuthenticated}
        onSend={handleSend}
        onOpenLogin={onOpenLogin}
        onOpenSignup={onOpenSignup}
        // Presentation mode props — ChatWindow uses these to render the
        // shared messages read-only and hide the chat input.
        isSharedMode={isSharedMode}
        sharedChatData={isSharedMode ? sharedChatData : null}
        isLoadingSharedChat={isSharedMode ? isLoadingSharedChat : false}
        sharedChatError={isSharedMode ? sharedChatError : null}
        onStartOwnChat={async () => {
          const params = new URLSearchParams(searchParams.toString());
          params.delete("sharedChat");
          router.replace(
            params.toString()
              ? `?${params.toString()}`
              : window.location.pathname,
          );
          if (isUserAuthenticated) {
            await getUserChats();
          }
        }}
      />

      {/* Sticky footer — only visible in presentation mode */}
      {isSharedMode && shareIdFromUrl && (
        <SharedChatFooter
          isAuthenticated={isUserAuthenticated}
          isForking={isForking}
          isLoadingSharedChat={isLoadingSharedChat}
          sharedChatError={sharedChatError}
          shareIdFromUrl={shareIdFromUrl}
          onFork={handleFork}
          onOpenLogin={handleOpenLoginForFork}
          alreadyExistsChatId={alreadyExistsChat}
          onOpenExisting={() => {
            if (!alreadyExistsChat) return;
            const params = new URLSearchParams(searchParams.toString());
            params.delete("sharedChat");
            router.replace(
              params.toString()
                ? `?${params.toString()}`
                : window.location.pathname,
            );
            getUserChats().then(() => {
              moveChatToTop(alreadyExistsChat);
              setActiveChatId(alreadyExistsChat);
              getChatMessages(alreadyExistsChat);
            });
          }}
        />
      )}
    </div>
  );
};
