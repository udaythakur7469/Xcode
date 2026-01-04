"use client";

import React, { useEffect, useState, useRef } from "react";
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
  const [isLoginOpen, setIsLoginOpen] = useState<boolean>(false);
  const [isSignupOpen, setIsSignupOpen] = useState<boolean>(false);
  const [isLogoutOpen, setIsLogoutOpen] = useState<boolean>(false);

  const { checkAuth, isUserAuthenticated } = useUserStore();

  const prevDialogOpenRef = useRef(false);

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
    moveChatToTop,
    resetStore,
    activeChatId,
    setActiveChatId,
  } = useChatStore();

  // Clear store when dialog closes
  useEffect(() => {
    if (!aiChatDialogOpen) {
      const timer = setTimeout(() => {
        resetStore();
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [aiChatDialogOpen, resetStore]);

  // Load chats when dialog opens
  useEffect(() => {
    const dialogJustOpened = aiChatDialogOpen && !prevDialogOpenRef.current;

    if (dialogJustOpened) {
      if (isUserAuthenticated) {
        getUserChats();
      } else {
        resetStore();
      }
    }

    prevDialogOpenRef.current = aiChatDialogOpen;
  }, [aiChatDialogOpen, getUserChats, isUserAuthenticated, resetStore]);

  // Auto-select first chat when chats load
  useEffect(() => {
    if (
      aiChatDialogOpen &&
      isUserAuthenticated &&
      userChats.length > 0 &&
      !activeChatId &&
      !isLoadingUserChats
    ) {
      const firstChatId = userChats[0].id;

      if (!firstChatId.startsWith("temp-")) {
        setActiveChatId(firstChatId);
        getChatMessages(firstChatId);
      }
    }
  }, [
    aiChatDialogOpen,
    isUserAuthenticated,
    userChats,
    activeChatId,
    isLoadingUserChats,
    getChatMessages,
    setActiveChatId,
  ]);

  const handleNewChat = async () => {
    try {
      const newChatId = await createChat();

      if (newChatId) {
        setActiveChatId(newChatId);

        if (!newChatId.startsWith("temp-")) {
          await getChatMessages(newChatId);
        }
      }
    } catch (error) {
      console.error("Failed to create new chat:", error);
    }
  };

  const handleSelectChat = async (chatId: string) => {
    if (chatId.startsWith("temp-")) {
      return;
    }

    // Just switch the view - polling continues in background
    setActiveChatId(chatId);
    await getChatMessages(chatId);
  };

  const handleDeleteChat = async (chatId: string) => {
    const isActiveChat = chatId === activeChatId;
    const currentChatIndex = userChats.findIndex((chat) => chat.id === chatId);

    try {
      // Delete chat (this kills polling and removes data)
      await deleteChat(chatId);

      // Wait for state update
      await new Promise((resolve) => setTimeout(resolve, 0));

      const { userChats: updatedChats } = useChatStore.getState();

      // If we deleted the active chat, select next available
      if (isActiveChat) {
        if (updatedChats.length > 0) {
          const nextIndex = Math.min(currentChatIndex, updatedChats.length - 1);
          const nextChatId = updatedChats[nextIndex].id;

          setActiveChatId(nextChatId);

          if (!nextChatId.startsWith("temp-")) {
            await getChatMessages(nextChatId);
          }
        } else {
          setActiveChatId(null);
        }
      }
    } catch (error) {
      console.error("Failed to delete chat:", error);
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!isUserAuthenticated) {
      console.log("User must be authenticated to send messages");
      return;
    }

    if (!activeChatId) {
      try {
        const newChatId = await createChat();

        if (newChatId) {
          setActiveChatId(newChatId);
          await sendMessage(newChatId, text);

          if (isUserAuthenticated) {
            await getUserChats();
          }
        }
      } catch (error) {
        console.error("Failed to create chat and send message:", error);
      }
      return;
    }

    try {
      const isFirstMessage = chatMessage.length === 0;

      moveChatToTop(activeChatId);
      await sendMessage(activeChatId, text);

      if (isFirstMessage && isUserAuthenticated) {
        await getUserChats();
        moveChatToTop(activeChatId);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  useEffect(() => {
    if (!commandPaletteDialogOpen) {
      setCommandPaletteSearchQuery("");
    }
  }, [commandPaletteDialogOpen]);

  const handleCommandPaletteSearch = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const query = e.target.value;
    setCommandPaletteSearchQuery(query);
  };

  const handleCommandPaletteClear = () => {
    setCommandPaletteSearchQuery("");
  };

  const openLoginDialogForGuestUsers = () => {
    setAiChatDialogOpen(false);
    setIsLoginOpen(true);
  };

  const openSignupDialogForGuestUsers = () => {
    setAiChatDialogOpen(false);
    setIsSignupOpen(true);
  };

  if (!isMounted) {
    return null;
  }

  return (
    <>
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

      <FloatingDialog
        open={aiChatDialogOpen}
        onOpenChange={setAiChatDialogOpen}
        title={<ChatTitle />}
        dialogType="AIChat"
        defaultSize={{ width: 700, height: 500 }}
        enableReset={true}
        enableMaximize={true}
        enableSidebar={isUserAuthenticated}
        sidebarContent={
          isUserAuthenticated ? (
            <ChatSidebar
              chats={userChats || []}
              activeChatId={activeChatId}
              onSelectChat={handleSelectChat}
              onNewChat={handleNewChat}
              isLoading={isLoadingUserChats}
              onDeleteChat={handleDeleteChat}
              gettingChatsError={UserChatsError}
            />
          ) : null
        }
      >
        <ChatWindow
          messages={chatMessage}
          sendMessage={handleSendMessage}
          sendingMessage={isSendingMessage}
          gettingMessage={isGettingChatMessages}
          gettingMessagesError={chatMessagesError}
          activeChatId={activeChatId}
          onOpenLogin={openLoginDialogForGuestUsers}
          onOpenSignup={openSignupDialogForGuestUsers}
        />
      </FloatingDialog>

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

      <LoginDialog
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        openSignup={() => {
          setIsLoginOpen(false);
          setIsSignupOpen(true);
        }}
        onSuccessfulAuth={checkAuth}
      />

      <SignupDialog
        isOpen={isSignupOpen}
        onClose={() => setIsSignupOpen(false)}
        openLogin={() => {
          setIsSignupOpen(false);
          setIsLoginOpen(true);
        }}
        onSuccessfulAuth={checkAuth}
      />

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
