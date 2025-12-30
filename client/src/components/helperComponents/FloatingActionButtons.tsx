"use client";

import React, { useEffect, useState } from "react";
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
  } = useChatStore();

  const handleNewChat = async () => {
    try {
      await createChat();
      await getUserChats();

      const { userChats: refreshedChats } = useChatStore.getState();
      if (refreshedChats && refreshedChats.length > 0) {
        setActiveChatId(refreshedChats[0].id);
        await getChatMessages(refreshedChats[0].id);
      }
    } catch (error) {
      console.error("Failed to create new chat:", error);
    }
  };

  const handleSelectChat = async (chatId: string) => {
    setActiveChatId(chatId);
    await getChatMessages(chatId);
  };

  const handleSendMessage = async (text: string) => {
    if (!activeChatId) {
      await handleNewChat();
      const { userChats: refreshedChats } = useChatStore.getState();
      if (refreshedChats && refreshedChats.length > 0) {
        const newChatId = refreshedChats[0].id;
        await sendMessage(newChatId, text);
        await getChatMessages(newChatId);
      }
      return;
    }

    try {
      await sendMessage(activeChatId, text);
      await getChatMessages(activeChatId);
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
          />
        }
      >
        <ChatWindow
          messages={chatMessage}
          sendMessage={handleSendMessage}
          sendingMessage={isSendingMessage}
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
