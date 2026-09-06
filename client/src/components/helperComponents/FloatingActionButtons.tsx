"use client";

import React, { useEffect, useState } from "react";
import { MessageSquare, Terminal } from "lucide-react";
import FAB from "./FAB";
import { useFABSystem } from "@/hooks/useFABSystem";
import FloatingDialog from "./FloatingDialog";
import CommandBarDialogTitle from "./commandBarDialog/title/CommandBarDialogTitle";
import CommandBarDialogContent from "./commandBarDialog/content/CommandBarDialogContent";
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
import SearchOverlays from "./aiChatDialog/search/SearchOverlays";
import { useChatStore } from "@/features/chatStore";
import { ForgotPasswordDialog } from "../auth/forgotPasswordPage/ForgotPasswordDialog";
import { useSearchParams } from "next/navigation";

const PENDING_SHARE_KEY = "pendingShareId";

const FloatingActionButtons = () => {
  const {
    isMounted,
    aiChatVisible,
    commandBarVisible,
    positions,
    sides,
    isDragging,
    draggedButton,
    repelledButton,
    aiChatDialogOpen,
    commandBarDialogOpen,
    setAiChatPermanentlyHidden,
    setCommandBarPermanentlyHidden,
    setAiChatDialogOpen,
    setCommandBarDialogOpen,
    handleDragStart,
    handleFABClick,
  } = useFABSystem();

  const searchParams = useSearchParams();
  const shareIdFromUrl = searchParams.get("sharedChat");
  const isSharedMode = !!shareIdFromUrl;

  const [commandBarSearchQuery, setCommandBarSearchQuery] =
    useState("");
  const [isLoginOpen, setIsLoginOpen] = useState<boolean>(false);
  const [isSignupOpen, setIsSignupOpen] = useState<boolean>(false);
  const [isLogoutOpen, setIsLogoutOpen] = useState<boolean>(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] =
    useState<boolean>(false);

    const { checkAuth, isUserAuthenticated } = useUserStore();
    const searchPanelOpen = useChatStore((s) => s.activePanel !== null);
    const closeSearchPanel = useChatStore((s) => s.closeSearchPanel);

    // Closing the AI chat dialog itself must also close any open search
    // panel immediately and deterministically — not rely on the unrelated
    // resetStore() cleanup effect in ChatContainer, which only runs on a
    // 300ms delay and exists for a different reason (clearing chat state on
    // close). The search panel's own "back to chat" button only calls
    // closeSearchPanel() — it must NOT close the dialog itself, just return
    // to the chat under it.
    const handleAiChatDialogOpenChange = (open: boolean) => {
      if (!open) closeSearchPanel();
      setAiChatDialogOpen(open);
    };

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
    if (!commandBarDialogOpen) {
      setCommandBarSearchQuery("");
    }
  }, [commandBarDialogOpen]);

  const handleCommandBarSearch = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const query = e.target.value;
    setCommandBarSearchQuery(query);
  };

  const handleCommandBarClear = () => {
    setCommandBarSearchQuery("");
  };

    const openLoginForSharedChat = (currentShareId: string) => {
      sessionStorage.setItem(PENDING_SHARE_KEY, currentShareId);
      closeSearchPanel();
      setAiChatDialogOpen(false);
      setIsLoginOpen(true);
    };

    const openLoginDialogForGuestUsers = () => {
      closeSearchPanel();
      setAiChatDialogOpen(false);
      setIsLoginOpen(true);
    };

    const openSignupDialogForGuestUsers = () => {
      closeSearchPanel();
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

      {commandBarVisible && (
        <FAB
          icon={<Terminal size={24} />}
          label="Command Bar (⌘/Ctrl+K)"
          onClick={() => handleFABClick("commandBar")}
          onClose={() => setCommandBarPermanentlyHidden(true)}
          position={positions.commandBar}
          onDragStart={handleDragStart("commandBar")}
          isDragging={isDragging === "commandBar"}
          side={sides.commandBar}
          isBeingRepelled={repelledButton === "commandBar"}
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
        overlayContent={(controls) => (
          <SearchOverlays dialogControls={controls} />
        )}
        overlayVisible={searchPanelOpen}
      >
        <ChatContainerWindow
          key={aiChatDialogOpen ? "open" : "closed"}
          onOpenLogin={openLoginDialogForGuestUsers}
          onOpenSignup={openSignupDialogForGuestUsers}
          onOpenLoginForSharedChat={openLoginForSharedChat}
        />
      </FloatingDialog>

      <FloatingDialog
        open={commandBarDialogOpen}
        onOpenChange={setCommandBarDialogOpen}
        title={
          <CommandBarDialogTitle
            commandBarSearchQuery={commandBarSearchQuery}
            handleCommandBarSearch={handleCommandBarSearch}
            handleCommandBarClear={handleCommandBarClear}
          />
        }
        dialogType="CommandBar"
        defaultSize={{ width: 600, height: 400 }}
        enableReset={true}
        enableMaximize={false}
      >
        <CommandBarDialogContent
          onClose={() => setCommandBarDialogOpen(false)}
          onOpenLogin={() => setIsLoginOpen(true)}
          onOpenSignup={() => setIsSignupOpen(true)}
          onOpenLogout={() => setIsLogoutOpen(true)}
          onOpenAIChat={() => setAiChatDialogOpen(true)}
          searchQuery={commandBarSearchQuery}
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
