import React, { useState } from "react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { ArrowLeft, Expand, Maximize, Minimize, Shrink } from "lucide-react";
import { useCommentPanel } from "@/context/commentPanelContext";
import { useUserStore } from "@/features/userStore";
import { LoginDialog } from "@/components/auth/loginPage/LoginDialog";
import { SignupDialog } from "@/components/auth/signupPage/SignupDialog";
import CommentSystem from "./commentSystem/CommentSystem";

type PostCommentsProps = {
  isMaximized: boolean;
  handleMaximizeMinimize: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
};

const PostComments: React.FC<PostCommentsProps> = ({
  isMaximized,
  handleMaximizeMinimize,
  isFullscreen,
  onToggleFullscreen,
}) => {
  const { userData, checkAuth } = useUserStore();
  const { setIsOpen, postId } = useCommentPanel();

  const [isLoginOpen, setIsLoginOpen] = useState<boolean>(false);
  const [isSignupOpen, setIsSignupOpen] = useState<boolean>(false);

  const userId = userData?.id;
  return (
    <div className="h-full w-full bg-background flex flex-col">
      {/* Toolbar */}
      <div className="h-[40px] bg-secondary rounded-t-md flex flex-row justify-end px-1 items-center shrink-0">
        <div className="flex justify-end mr-2 items-center">
          {/* Toggle between Fullscreen (Expand) and Exit Fullscreen (Shrink)
              icons — spans BOTH the left and right resizable panels, unlike
              Maximize/Minimize below which only resizes the right panel.
              Copied verbatim from AIAnalysisPanel.tsx (Part 5, File 4) —
              same icons, same colors, same tooltip text. */}
          {isFullscreen ? (
            <HoverCard>
              <HoverCardTrigger asChild>
                <Shrink
                  className="ml-2 mr-2 cursor-pointer text-blue-500 hover:text-blue-600"
                  size={20}
                  onClick={onToggleFullscreen}
                />
              </HoverCardTrigger>
              <HoverCardContent className="mr-5 p-1">
                Exit Fullscreen
              </HoverCardContent>
            </HoverCard>
          ) : (
            <HoverCard>
              <HoverCardTrigger asChild>
                <Expand
                  className="ml-2 mr-2 cursor-pointer text-blue-500 hover:text-blue-600"
                  size={20}
                  onClick={onToggleFullscreen}
                />
              </HoverCardTrigger>
              <HoverCardContent className="mr-5 p-1">
                Fullscreen
              </HoverCardContent>
            </HoverCard>
          )}

          {/* Toggle between Maximize and Minimize icons */}
          {isMaximized ? (
            <HoverCard>
              <HoverCardTrigger asChild>
                <Minimize
                  className="ml-2 mr-2 cursor-pointer text-yellow-500 hover:text-yellow-600"
                  size={20}
                  onClick={handleMaximizeMinimize}
                />
              </HoverCardTrigger>
              <HoverCardContent className="mr-5 p-1">Minimize</HoverCardContent>
            </HoverCard>
          ) : (
            <HoverCard>
              <HoverCardTrigger asChild>
                <Maximize
                  className="ml-2 mr-2 cursor-pointer text-yellow-500 hover:text-yellow-600"
                  size={20}
                  onClick={handleMaximizeMinimize}
                />
              </HoverCardTrigger>
              <HoverCardContent className="mr-5 p-1">Maximize</HoverCardContent>
            </HoverCard>
          )}
        </div>
      </div>

      {/* Header — fixed, never scrolls */}
      <div className="flex items-center justify-start pb-1 mt-2 border-b shrink-0">
        <button
          onClick={() => setIsOpen(false)}
          className="flex flex-row items-center justify-center"
          aria-label="Close"
        >
          <ArrowLeft size={18} className="mx-1" />
          Back to editor
        </button>
      </div>
      {/* ── Scrollable comment area ──────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3">
        <CommentSystem
          postId={postId}
          currentUserId={userId ?? null}
          onOpenLogin={() => setIsLoginOpen(true)}
        />
      </div>
      {/* ── Auth dialogs — owned here, opened from anywhere in the tree ── */}
      <LoginDialog
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        openSignup={() => {
          setIsLoginOpen(false);
          setIsSignupOpen(true);
        }}
        openForgotPassword={() => {
          /* Close login dialog; no separate forgot-password dialog implemented here. */
          setIsLoginOpen(false);
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
    </div>
  );
};
export default PostComments;
