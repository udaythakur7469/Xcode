"use client";

import React, { useEffect, useRef, useState } from "react";
import { MessageSquare, Terminal } from "lucide-react";
import FAB from "./FAB";
import { useFABSystem } from "@/hooks/useFABSystem";
import FloatingDialog from "./FloatingDialog";
import CommandPaletteDialogTitle from "./commandPaletteDialog/title/CommandPaletteDialogTitle";
import CommandPaletteDialogContent from "./commandPaletteDialog/content/CommandPaletteDialogContent";
import { SignupDialog } from "../auth/signupPage/SignupDialog";
import { LoginDialog } from "../auth/loginPage/LoginDialog";
import { useUserStore } from "@/features/userStore";
import LogoutDialog from "../landingPage/helperComponents/LogoutDialog";
import { Dialog } from "../ui/dialog";
import ChatWindow from "./aiChatDialog/chat/ChatWindow";
import ChatTitle from "./aiChatDialog/title/ChatTitle";
import ChatSidebar from "./aiChatDialog/sidebar/ChatSidebar";
import { useChatStore } from "@/features/chatStore";

const FloatingActionButtons = () => {
  const {
    isMounted,
    aiChatVisible,
    commandPaletteVisible,
    positions,
    sides,
    isDragging,
    draggedButton,
    repelledButton,
    aiChatDialogOpen,
    commandPaletteDialogOpen,
    setAiChatPermanentlyHidden,
    setCommandPalettePermanentlyHidden,
    setAiChatDialogOpen,
    setCommandPaletteDialogOpen,
    handleDragStart,
    handleFABClick,
  } = useFABSystem();

  const [commandPaletteSearchQuery, setCommandPaletteSearchQuery] =
    useState("");
  // State to control the login dialog
  const [isLoginOpen, setIsLoginOpen] = useState<boolean>(false);
  const [isSignupOpen, setIsSignupOpen] = useState<boolean>(false);
  const [isLogoutOpen, setIsLogoutOpen] = useState<boolean>(false);

  const hasInitializedRef = useRef(false);

  const { checkAuth } = useUserStore();

  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const {
    createChat,
    getChatMessages,
    chatMessage,
    sendMessage,
    isSendingMessage,
    getUserChats,
    userChats,
    isLoadingUserChats,
    deleteChat,
    isGettingChatMessages,
    chatMessagesError,
    UserChatsError,
    clearMessages,
  } = useChatStore();

  // ✅ FIX 1: Auto-select first chat when dialog opens
  useEffect(() => {
    if (
      aiChatDialogOpen &&
      userChats.length > 0 &&
      !activeChatId &&
      !hasInitializedRef.current
    ) {
      hasInitializedRef.current = true;
      const firstChatId = userChats[0].id;
      setActiveChatId(firstChatId);
      getChatMessages(firstChatId);
    }

    // Reset initialization flag when dialog closes
    if (!aiChatDialogOpen) {
      hasInitializedRef.current = false;
    }
  }, [aiChatDialogOpen, userChats, activeChatId, getChatMessages]);

  // ✅ FIX 2: Validate activeChatId against current chat list
  useEffect(() => {
    if (activeChatId && userChats.length > 0) {
      const chatExists = userChats.some((chat) => chat.id === activeChatId);
      if (!chatExists) {
        // Active chat was deleted, select first available chat
        const firstChatId = userChats[0].id;
        setActiveChatId(firstChatId);
        getChatMessages(firstChatId);
      }
    } else if (activeChatId && userChats.length === 0) {
      // All chats deleted, clear everything
      setActiveChatId(null);
      clearMessages();
    }
  }, [userChats, activeChatId, getChatMessages, clearMessages]);

  const handleNewChat = async () => {
    try {
      const newChatId = await createChat();

      if (newChatId) {
        setActiveChatId(newChatId);
        await getChatMessages(newChatId);
      }
    } catch (error) {
      console.error("Failed to create new chat:", error);
    }
  };

  const handleSelectChat = async (chatId: string) => {
    setActiveChatId(chatId);
    await getChatMessages(chatId);
  };

  const handleDeleteChat = async (chatId: string) => {
    const currentChatIndex = userChats.findIndex((chat) => chat.id === chatId);
    const isActiveChat = chatId === activeChatId;

    try {
      await deleteChat(chatId);
      await getUserChats();

      // ✅ FIX 3: Handle active chat deletion
      if (isActiveChat) {
        const { userChats: updatedChats } = useChatStore.getState();

        if (updatedChats.length > 0) {
          // Select the chat at the same index, or the last one if we deleted the last chat
          const nextIndex = Math.min(currentChatIndex, updatedChats.length - 1);
          const nextChatId = updatedChats[nextIndex].id;
          setActiveChatId(nextChatId);
          await getChatMessages(nextChatId);
        } else {
          // ✅ FIX 4: All chats deleted
          setActiveChatId(null);
          clearMessages();
        }
      }
    } catch (error) {
      console.error("Failed to delete chat:", error);
    }
  };

  const handleSendMessage = async (text: string) => {
    // If no active chat, create one first
    if (!activeChatId) {
      const newChatId = await createChat();

      if (newChatId) {
        setActiveChatId(newChatId);
        await sendMessage(newChatId, text);
        // Chat will be moved to top by sendMessage in store
      }
      return;
    }

    try {
      // ✅ FIX 5: Send message - chat will auto-move to top via store
      await sendMessage(activeChatId, text);

      // Ensure the chat that just received a message stays active
      // (moveChatToTop is already called inside sendMessage)

      // Optionally refresh from backend to sync timestamps
      await getUserChats();
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  useEffect(() => {
    if (!commandPaletteDialogOpen) {
      setCommandPaletteSearchQuery("");
    }
  }, [commandPaletteDialogOpen]);

  // ✅ Load chats when dialog opens
  useEffect(() => {
    if (aiChatDialogOpen) {
      getUserChats();
    }
  }, [aiChatDialogOpen, getUserChats]);

  const handleCommandPaletteSearch = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const query = e.target.value;
    setCommandPaletteSearchQuery(query);
  };

  const handleCommandPaletteClear = () => {
    setCommandPaletteSearchQuery("");
  };

  if (!isMounted) {
    return null;
  }

  return (
    <>
      {/* AI Chat FAB */}
      {aiChatVisible && (
        <FAB
          icon={<MessageSquare size={24} />}
          label="AI Chat (⌘/Ctrl+Q)"
          onClick={() => handleFABClick("aiChat")}
          onClose={() => setAiChatPermanentlyHidden(true)}
          position={positions.aiChat}
          onDragStart={handleDragStart("aiChat")}
          isDragging={isDragging === "aiChat"}
          side={sides.aiChat}
          isBeingRepelled={repelledButton === "aiChat"}
        />
      )}

      {/* Command Palette FAB */}
      {commandPaletteVisible && (
        <FAB
          icon={<Terminal size={24} />}
          label="Command Palette (⌘/Ctrl+K)"
          onClick={() => handleFABClick("commandPalette")}
          onClose={() => setCommandPalettePermanentlyHidden(true)}
          position={positions.commandPalette}
          onDragStart={handleDragStart("commandPalette")}
          isDragging={isDragging === "commandPalette"}
          side={sides.commandPalette}
          isBeingRepelled={repelledButton === "commandPalette"}
        />
      )}

      {/* AI Chat Dialog */}
      <FloatingDialog
        open={aiChatDialogOpen}
        onOpenChange={setAiChatDialogOpen}
        title={<ChatTitle />}
        dialogType="AIChat"
        defaultSize={{ width: 700, height: 500 }}
        enableReset={true}
        enableMaximize={true}
        enableSidebar={true}
        sidebarContent={
          <ChatSidebar
            chats={userChats || []}
            activeChatId={activeChatId}
            onSelectChat={handleSelectChat}
            onNewChat={handleNewChat}
            isLoading={isLoadingUserChats}
            onDeleteChat={handleDeleteChat}
            gettingChatsError={UserChatsError}
          />
        }
      >
        <ChatWindow
          messages={chatMessage}
          sendMessage={handleSendMessage}
          sendingMessage={isSendingMessage}
          gettingMessage={isGettingChatMessages}
          gettingMessagesError={chatMessagesError}
        />
      </FloatingDialog>

      {/* Command Palette Dialog */}
      <FloatingDialog
        open={commandPaletteDialogOpen}
        onOpenChange={setCommandPaletteDialogOpen}
        title={
          <CommandPaletteDialogTitle
            commandPaletteSearchQuery={commandPaletteSearchQuery}
            handleCommandPaletteSearch={handleCommandPaletteSearch}
            handleCommandPaletteClear={handleCommandPaletteClear}
          />
        }
        dialogType="CommandPalette"
        defaultSize={{ width: 600, height: 400 }}
        enableReset={true}
        enableMaximize={false}
      >
        <CommandPaletteDialogContent
          onClose={() => setCommandPaletteDialogOpen(false)}
          onOpenLogin={() => setIsLoginOpen(true)}
          onOpenSignup={() => setIsSignupOpen(true)}
          onOpenLogout={() => setIsLogoutOpen(true)}
          searchQuery={commandPaletteSearchQuery}
        />
      </FloatingDialog>
      {/* Login Dialog */}
      <LoginDialog
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        openSignup={() => {
          setIsLoginOpen(false);
          setIsSignupOpen(true);
        }}
        onSuccessfulAuth={checkAuth}
      />

      {/* Signup Dialog */}
      <SignupDialog
        isOpen={isSignupOpen}
        onClose={() => setIsSignupOpen(false)}
        openLogin={() => {
          setIsSignupOpen(false);
          setIsLoginOpen(true);
        }}
        onSuccessfulAuth={checkAuth}
      />

      {/* Logout Dialog */}
      <Dialog open={isLogoutOpen} onOpenChange={setIsLogoutOpen}>
        <LogoutDialog
          isOpen={isLogoutOpen}
          onClose={() => setIsLogoutOpen(false)}
        />
      </Dialog>
    </>
  );
};

export default FloatingActionButtons;
