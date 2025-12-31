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

  const { checkAuth } = useUserStore();

  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const prevDialogOpenRef = useRef(false);
  // ✅ NEW: Track the chat that should be pinned to top (most recently interacted with)
  const pinnedChatIdRef = useRef<string | null>(null);
  
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
    moveChatToTop,
  } = useChatStore();

  // ✅ FIX 1: Deterministic Active Chat Resolver
  const resolveActiveChat = (
    currentActiveChatId: string | null,
    chatsList: typeof userChats
  ): string | null => {
    if (chatsList.length === 0) {
      return null;
    }

    if (currentActiveChatId && chatsList.some(chat => chat.id === currentActiveChatId)) {
      return currentActiveChatId;
    }

    return chatsList[0].id;
  };

  // ✅ FIX 2: Master State Synchronization Effect
  useEffect(() => {
    const resolvedChatId = resolveActiveChat(activeChatId, userChats);

    if (resolvedChatId !== activeChatId) {
      setActiveChatId(resolvedChatId);
      
      if (resolvedChatId) {
        getChatMessages(resolvedChatId);
      } else {
        clearMessages();
      }
    }
  }, [userChats, activeChatId, getChatMessages, clearMessages]);

  // ✅ NEW: After chats load, ensure pinned chat is at top
  useEffect(() => {
    if (pinnedChatIdRef.current && userChats.length > 0) {
      const pinnedChatExists = userChats.some(
        chat => chat.id === pinnedChatIdRef.current
      );
      
      if (pinnedChatExists) {
        // Move pinned chat to top
        moveChatToTop(pinnedChatIdRef.current);
      } else {
        // Pinned chat was deleted, clear the pin
        pinnedChatIdRef.current = null;
      }
    }
  }, [userChats, moveChatToTop]);

  // ✅ FIX 3: Dialog Open Lifecycle Guard
  useEffect(() => {
    const dialogJustOpened = aiChatDialogOpen && !prevDialogOpenRef.current;
    
    if (dialogJustOpened) {
      getUserChats();
      // Clear pinned chat when dialog opens fresh
      pinnedChatIdRef.current = null;
    }

    prevDialogOpenRef.current = aiChatDialogOpen;
  }, [aiChatDialogOpen, getUserChats]);

  // ✅ FIX 4: First chat auto-selection
  useEffect(() => {
    if (aiChatDialogOpen && userChats.length > 0 && !activeChatId && !isLoadingUserChats) {
      const firstChatId = userChats[0].id;
      setActiveChatId(firstChatId);
      getChatMessages(firstChatId);
    }
  }, [aiChatDialogOpen, userChats, activeChatId, isLoadingUserChats, getChatMessages]);

  const handleNewChat = async () => {
    try {
      const newChatId = await createChat();
      
      if (newChatId) {
        setActiveChatId(newChatId);
        await getChatMessages(newChatId);
        // Pin this new chat to top
        pinnedChatIdRef.current = newChatId;
      }
    } catch (error) {
      console.error("Failed to create new chat:", error);
    }
  };

  const handleSelectChat = async (chatId: string) => {
    setActiveChatId(chatId);
    await getChatMessages(chatId);
    // Don't pin on selection, only on message send
  };

  const handleDeleteChat = async (chatId: string) => {
    const isActiveChat = chatId === activeChatId;
    const currentChatIndex = userChats.findIndex((chat) => chat.id === chatId);
    
    // Clear pin if deleting the pinned chat
    if (pinnedChatIdRef.current === chatId) {
      pinnedChatIdRef.current = null;
    }
    
    try {
      await deleteChat(chatId);
      await getUserChats();
      
      const { userChats: updatedChats } = useChatStore.getState();
      
      if (isActiveChat) {
        if (updatedChats.length > 0) {
          const nextIndex = Math.min(currentChatIndex, updatedChats.length - 1);
          const nextChatId = updatedChats[nextIndex].id;
          
          setActiveChatId(nextChatId);
          await getChatMessages(nextChatId);
        } else {
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
      try {
        const newChatId = await createChat();
        
        if (newChatId) {
          setActiveChatId(newChatId);
          
          // Pin this chat to ensure it stays at top
          pinnedChatIdRef.current = newChatId;
          
          // Send message (will move to top optimistically)
          await sendMessage(newChatId, text);
          
          // ✅ Refresh from backend to get updated chat title
          // Backend typically generates title from first message
          await getUserChats();
          // The pinned chat effect will ensure it stays at top
        }
      } catch (error) {
        console.error("Failed to create chat and send message:", error);
      }
      return;
    }

    try {
      // Check if this chat has any messages (to detect first message scenario)
      const isFirstMessage = chatMessage.length === 0;
      
      // ✅ CRITICAL FIX: Pin the chat before sending
      // This ensures it stays at top even after backend refresh
      pinnedChatIdRef.current = activeChatId;
      
      // Move to top optimistically (immediate UI feedback)
      moveChatToTop(activeChatId);
      
      // Send message to backend
      await sendMessage(activeChatId, text);
      
      // ✅ Always refresh chat list from backend to get:
      // - Updated timestamps
      // - Updated chat title (especially important for first message)
      await getUserChats();
      
      // The useEffect with pinnedChatIdRef will automatically move it back to top
      // after the backend data loads
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
          activeChatId={activeChatId}
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