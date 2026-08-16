import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
} from "@/components/ui/problem-detail-menubar";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  CloudUpload,
  Keyboard,
  LayoutDashboard,
  List,
  Play,
} from "lucide-react";
import { ThemeToggle } from "@/components/themes/themeToggle";
import {
  DropdownMenu,
  DropdownMenuTrigger,
} from "@/components/ui/logout-dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import AccountDropDown from "@/components/landingPage/helperComponents/AccountDropDown";
import { useUserStore } from "@/features/userStore";
import { LoginDialog } from "@/components/auth/loginPage/LoginDialog";
import { SignupDialog } from "@/components/auth/signupPage/SignupDialog";
import Timer, { TimerRef } from "./Timer";
import LayoutDropdown from "./LayoutDropdown";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { toast } from "sonner";
import { useSubmissionStore } from "@/features/submissionStore";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import ShortcutDialog from "./shortcuts/ShortcutDialog";
import NotesButton from "./stickyNotesSystem/StickyNotesButton";
import { ForgotPasswordDialog } from "@/components/auth/forgotPasswordPage/ForgotPasswordDialog";
import { useProblemStore } from "@/features/problemStore";

type ProblemNavbarProps = {
  onResetLayout?: () => void;
  onRunCode?: () => void;
  onSubmitCode?: () => void;
  onToggleSidebar?: () => void;
  code: string;
  language: string;
};

const ProblemNavbar: React.FC<ProblemNavbarProps> = ({
  onResetLayout,
  onRunCode,
  onSubmitCode,
  onToggleSidebar,
  code,
  language,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const problemTitle = searchParams.get("title");

  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSignupOpen, setIsSignupOpen] = useState(false);
  const [isShortcutDialogOpen, setIsShortcutDialogOpen] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] =
    useState<boolean>(false);
  const timerRef = useRef<TimerRef>(null);

  const { checkAuth, userData, isUserAuthenticated } = useUserStore();
  const { runCode, isRunningCode, submitCode, isSubmittingCode } =
    useSubmissionStore();
  const { refreshProblemLikesAndDislikes } = useProblemStore();

  // Refetch problem reactions the moment checkUser resolves to
  // "authenticated" — not just when the Login/Signup dialogs' own
  // onSuccessfulAuth fires. Reacting to isUserAuthenticated itself (rather
  // than to a specific dialog's callback) means this fires uniformly no
  // matter HOW the user became authenticated: the email/password form,
  // an OAuth redirect back to this page, or a magic-link landing — none
  // of which necessarily go through the same explicit callback.
  //
  // wasAuthenticatedRef tracks the PREVIOUS render's value so this only
  // fires on the false -> true transition, not on every render while
  // already logged in, and not on initial mount if the user was already
  // authenticated when the page loaded (getProblemByTitle's own fetch
  // already gets the correct reaction data in that case).
  const wasAuthenticatedRef = useRef(isUserAuthenticated);
  useEffect(() => {
    const justLoggedIn = !wasAuthenticatedRef.current && isUserAuthenticated;
    wasAuthenticatedRef.current = isUserAuthenticated;
    if (justLoggedIn && problemTitle) {
      refreshProblemLikesAndDislikes(problemTitle);
    }
  }, [isUserAuthenticated, problemTitle, refreshProblemLikesAndDislikes]);

  useEffect(() => {
    const keyboardShortcut = (e: KeyboardEvent) => {
      const isAlt = e.altKey;
      const isT = e.key === "t" || e.key === "T";
      const isSlash = e.key === "/";

      // Alt + T for timer
      if (isAlt && isT) {
        e.preventDefault();
        timerRef.current?.toggleTimer();
      }

      // Ctrl + Shift + / for shortcuts dialog
      if (isAlt && isSlash) {
        e.preventDefault();
        setIsShortcutDialogOpen(true);
      }
    };

    window.addEventListener("keydown", keyboardShortcut);

    return () => {
      window.removeEventListener("keydown", keyboardShortcut);
    };
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const name = userData?.name;

  const picture: string | unknown = userData?.picture;
  const firstLetter = name ? name[0] : null;

  const goToHomePage = () => {
    router.push("/");
  };

  // Update the Run button click handler
  const handleRunClick = async () => {
    if (isRunningCode || isSubmittingCode) {
      return;
    }
    // The button is styled as disabled when logged out (see the JSX
    // below) but deliberately kept clickable rather than given a native
    // `disabled` attribute, specifically so this toast can fire. A truly
    // disabled button swallows the click silently, which would just look
    // broken to a logged-out user instead of telling them what to do.
    if (!isUserAuthenticated) {
      toast.error("Please log in to run your code.");
      return;
    }
    if (!problemTitle) {
      toast.error("Problem title not found");
      return;
    }

    if (!code.trim()) {
      toast.error("Please write some code first");
      return;
    }

    try {
      if (onRunCode) {
        onRunCode();
      }
      await runCode(language, code, problemTitle);
      console.log("Code executed");
    } catch (error) {
      toast.error("Failed to run code");
      console.error("runCodeError", error);
    }
  };

  // Update the Submit button click handler
  const handleSubmitClick = async () => {
    if (isRunningCode || isSubmittingCode) {
      return;
    }
    // See matching comment in handleRunClick above.
    if (!isUserAuthenticated) {
      toast.error("Please log in to submit your code.");
      return;
    }
    if (!problemTitle) {
      toast.error("Problem title not found");
      return;
    }

    if (!code.trim()) {
      toast.error("Please write some code first");
      return;
    }

    try {
      if (onSubmitCode) {
        onSubmitCode();
      }
      await submitCode(language, code, problemTitle);

      console.log("Code submitted");
    } catch (error) {
      toast.error("Failed to submit code");
      console.error("submitCodeError", error);
    }
  };

  const handleProblemListClick = () => {
    if (onToggleSidebar) {
      onToggleSidebar();
    }
  };

  return (
    <>
      <Menubar className="w-full bg-black grid grid-cols-3 gap-0 h-12">
        {/* Left Section */}
        <div className="flex justify-start items-center h-full">
          <MenubarMenu>
            <div className="flex items-center justify-center w-11 h-11 ml-2 mr-2 cursor-pointer">
              <Image
                src="/logo-icon-only.svg"
                width={44}
                height={44}
                alt="logo"
                onClick={goToHomePage}
                className="p-0"
              />
            </div>
            <div className="flex space-x-2 h-full items-center">
              <div
                className="flex justify-center items-center rounded-md px-2 bg-secondary h-8 cursor-pointer bg-red-500"
                onClick={handleProblemListClick}
              >
                <List className="mr-2 h-4 w-4 " />
                Problem List
              </div>
              <div className="flex justify-center items-center rounded-md px-1 bg-secondary h-8 w-8 cursor-pointer">
                <ChevronLeft className="h-4 w-4" />
              </div>
              <div className="flex justify-center items-center rounded-md px-1 bg-secondary h-8 w-8 cursor-pointer">
                <ChevronRight className="h-4 w-4" />
              </div>
            </div>
          </MenubarMenu>
        </div>

        {/* Center Section */}
        <div className="flex justify-center items-center h-full">
          <MenubarMenu>
            <div className="flex justify-center items-center space-x-2 h-full">
              <NotesButton />
              <HoverCard>
                <HoverCardTrigger asChild>
                  <div
                    className={`flex justify-center items-center rounded-md px-2 bg-secondary h-8 w-[90px] ${
                      isRunningCode || isSubmittingCode
                        ? "cursor-not-allowed opacity-75 pointer-events-none"
                        : !isUserAuthenticated
                          ? // Styled as disabled, but deliberately NOT
                            // pointer-events-none — the div must stay
                            // clickable so handleRunClick's auth check can
                            // fire the "please log in" toast. A truly inert
                            // div would silently do nothing on click.
                            "cursor-not-allowed opacity-50 hover:bg-secondary"
                          : "cursor-pointer hover:bg-secondary/80"
                    }`}
                    onClick={handleRunClick}
                  >
                    <Play className="mr-2 h-4 w-4" />
                    <p
                      className={`text-white ${
                        isRunningCode ||
                        isSubmittingCode ||
                        !isUserAuthenticated
                          ? "cursor-not-allowed"
                          : "cursor-pointer"
                      }`}
                    >
                      {isRunningCode ? "Running..." : "Run"}
                    </p>
                  </div>
                </HoverCardTrigger>
                <HoverCardContent className="mr-5 p-1">
                  {!isUserAuthenticated
                    ? "Log in to run code"
                    : isRunningCode
                      ? "Running..."
                      : "Run Code"}
                </HoverCardContent>
              </HoverCard>

              <HoverCard>
                <HoverCardTrigger asChild>
                  <div
                    className={`flex justify-center items-center rounded-md px-2 bg-secondary h-8 ${
                      isRunningCode || isSubmittingCode
                        ? "cursor-not-allowed opacity-75 pointer-events-none"
                        : !isUserAuthenticated
                          ? // See matching comment on the Run button above.
                            "cursor-not-allowed opacity-50 hover:bg-secondary"
                          : "cursor-pointer hover:bg-secondary/80"
                    }`}
                    onClick={handleSubmitClick}
                  >
                    <CloudUpload className="mr-2 h-4 w-4 text-green-400" />
                    <p
                      className={`text-green-400 ${
                        isRunningCode ||
                        isSubmittingCode ||
                        !isUserAuthenticated
                          ? "cursor-not-allowed"
                          : "cursor-pointer"
                      }`}
                    >
                      {isSubmittingCode ? "Submitting..." : "Submit"}
                    </p>
                  </div>
                </HoverCardTrigger>
                <HoverCardContent className="mr-5 p-1">
                  {!isUserAuthenticated
                    ? "Log in to submit code"
                    : isSubmittingCode
                      ? "Submitting..."
                      : "Submit Code"}
                </HoverCardContent>
              </HoverCard>
              <div className="flex justify-center items-center rounded-md p-1 bg-secondary h-8 w-auto cursor-pointer">
                <Timer ref={timerRef} />
              </div>
            </div>
          </MenubarMenu>
        </div>

        {/* Right Section */}
        <div className="flex justify-end items-center h-full">
          <MenubarMenu>
            <div className="flex justify-center items-center space-x-2 h-full mr-2">
              <div className="flex justify-center items-center rounded-md bg-secondary h-8 cursor-pointer">
                <ThemeToggle />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="flex justify-center items-center rounded-md p-1 bg-secondary h-8 w-8 cursor-pointer">
                    <LayoutDashboard className="h-4 w-4" />
                  </div>
                </DropdownMenuTrigger>
                <LayoutDropdown onResetLayout={onResetLayout} />
              </DropdownMenu>
              <Dialog
                open={isShortcutDialogOpen}
                onOpenChange={setIsShortcutDialogOpen}
              >
                <DialogTrigger asChild>
                  <div className="flex justify-center items-center rounded-md p-1 bg-secondary h-8 w-8 cursor-pointer">
                    <Keyboard className="h-4 w-4" />
                  </div>
                </DialogTrigger>
                <ShortcutDialog open={isShortcutDialogOpen} />
              </Dialog>
              <MenubarMenu>
                {isUserAuthenticated ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <div className="cursor-pointer">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={picture || ""} />
                          <AvatarFallback>{firstLetter}</AvatarFallback>
                        </Avatar>
                      </div>
                    </DropdownMenuTrigger>
                    <AccountDropDown />
                  </DropdownMenu>
                ) : (
                  <MenubarTrigger
                    className="h-8 text-base flex justify-center items-center rounded-md bg-secondary px-2"
                    onClick={() => setIsLoginOpen(true)}
                  >
                    Login
                  </MenubarTrigger>
                )}
              </MenubarMenu>
            </div>
          </MenubarMenu>
        </div>
      </Menubar>
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

      <ForgotPasswordDialog
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
        openLogin={() => {
          setIsForgotPasswordOpen(false);
          setIsLoginOpen(true);
        }}
      />
    </>
  );
};
export default ProblemNavbar;
