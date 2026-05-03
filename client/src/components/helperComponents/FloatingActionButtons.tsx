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
import ChatTitle from "./aiChatDialog/title/ChatTitle";
import {
  ChatContainerSidebar,
  ChatContainerWindow,
} from "./aiChatDialog/ChatContainer";
import { ForgotPasswordDialog } from "../auth/forgotPasswordPage/ForgotPasswordDialog";
import { useSearchParams } from "next/navigation";

const PENDING_SHARE_KEY = "pendingShareId";

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

  const searchParams = useSearchParams();
  const shareIdFromUrl = searchParams.get("sharedChat");
  const isSharedMode = !!shareIdFromUrl;

  const [commandPaletteSearchQuery, setCommandPaletteSearchQuery] =
    useState("");
  const [isLoginOpen, setIsLoginOpen] = useState<boolean>(false);
  const [isSignupOpen, setIsSignupOpen] = useState<boolean>(false);
  const [isLogoutOpen, setIsLogoutOpen] = useState<boolean>(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] =
    useState<boolean>(false);

  const { checkAuth, isUserAuthenticated } = useUserStore();

  useEffect(() => {
    if (shareIdFromUrl && !aiChatDialogOpen) {
      setAiChatDialogOpen(true);
    }
  }, [shareIdFromUrl]);

  useEffect(() => {
    if (!isUserAuthenticated) return;
    const pending = sessionStorage.getItem(PENDING_SHARE_KEY);
    if (pending) {
      sessionStorage.removeItem(PENDING_SHARE_KEY);
      setAiChatDialogOpen(true);
    }
  }, [isUserAuthenticated]);

  useEffect(() => {
    if (!commandPaletteDialogOpen) {
      setCommandPaletteSearchQuery("");
    }
  }, [commandPaletteDialogOpen]);

  const handleCommandPaletteSearch = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const query = e.target.value;
    setCommandPaletteSearchQuery(query);
  };

  const handleCommandPaletteClear = () => {
    setCommandPaletteSearchQuery("");
  };

  const openLoginForSharedChat = (currentShareId: string) => {
    sessionStorage.setItem(PENDING_SHARE_KEY, currentShareId);
    setAiChatDialogOpen(false);
    setIsLoginOpen(true);
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
        enableSidebar={isUserAuthenticated || isSharedMode}
        forceSidebarClosed={isSharedMode}
        sidebarContent={
          <ChatContainerSidebar
            isDialogOpen={aiChatDialogOpen}
            setDialogOpen={setAiChatDialogOpen}
            onOpenLoginForSharedChat={openLoginForSharedChat}
          />
        }
      >
        <ChatContainerWindow
          key={aiChatDialogOpen ? "open" : "closed"}
          onOpenLogin={openLoginDialogForGuestUsers}
          onOpenSignup={openSignupDialogForGuestUsers}
          onOpenLoginForSharedChat={openLoginForSharedChat}
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
        openForgotPassword={() => {
          setIsLoginOpen(false);
          setIsForgotPasswordOpen(true);
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

      <ForgotPasswordDialog
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
        openLogin={() => {
          setIsForgotPasswordOpen(false);
          setIsLoginOpen(true);
        }}
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
