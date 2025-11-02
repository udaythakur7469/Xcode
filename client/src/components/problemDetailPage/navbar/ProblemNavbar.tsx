import React, { useEffect, useState } from "react";
import Image from "next/image";
import {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
} from "@/components/ui/problem-detail-menubar";
import { useRouter } from "next/navigation";
import {
  Brain,
  ChevronLeft,
  ChevronRight,
  CloudUpload,
  LayoutDashboard,
  List,
  Play,
  Settings,
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
import Timer from "./Timer";
import LayoutDropdown from "./LayoutDropdown";
import FloatingDialog from "@/components/helperComponents/FloatingDialog";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

type ProblemNavbarProps = {
  onResetLayout?: () => void;
  onRunCode?: () => void;
  onSubmitCode?: () => void;
  onToggleSidebar?: () => void;
};

const ProblemNavbar: React.FC<ProblemNavbarProps> = ({
  onResetLayout,
  onRunCode,
  onSubmitCode,
  onToggleSidebar,
}) => {
  const router = useRouter();

  const { checkAuth, userData, isAuthenticated } = useUserStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const name = userData?.name;

  const picture: string | unknown = userData?.picture;
  const firstLetter = name ? name[0] : null;

  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSignupOpen, setIsSignupOpen] = useState(false);
  const [isAIDialogOpen, setIsAIDialogOpen] = useState(false);

  const goToHomePage = () => {
    router.push("/");
  };

  // Update the Run button click handler
  const handleRunClick = () => {
    if (onRunCode) {
      onRunCode();
    }
  };

  // Update the Submit button click handler
  const handleSubmitClick = () => {
    if (onSubmitCode) {
      onSubmitCode();
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
            <Image
              src="/Icon-Image-Black.png"
              width={28}
              height={28}
              alt="logo"
              onClick={goToHomePage}
              className="p-0 ml-2 mr-2 cursor-pointer"
            />
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
              <HoverCard>
                <HoverCardTrigger asChild>
                  <div
                    className="flex justify-center items-center rounded-md px-2 bg-secondary h-8 cursor-pointer"
                    onClick={() => setIsAIDialogOpen(true)}
                  >
                    <Brain className="h-4 w-4 text-yellow-400" />
                  </div>
                </HoverCardTrigger>
                <HoverCardContent className="mr-5 p-1">
                  AI Chat
                </HoverCardContent>
              </HoverCard>
              <HoverCard>
                <HoverCardTrigger asChild>
                  <div
                    className="flex justify-center items-center rounded-md px-2 bg-secondary h-8 w-[90px] cursor-pointer"
                    onClick={handleRunClick}
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Run
                  </div>
                </HoverCardTrigger>
                <HoverCardContent className="mr-5 p-1">
                  Run Code
                </HoverCardContent>
              </HoverCard>

              <HoverCard>
                <HoverCardTrigger asChild>
                  <div
                    className="flex justify-center items-center rounded-md px-2 bg-secondary h-8 cursor-pointer"
                    onClick={handleSubmitClick}
                  >
                    <CloudUpload className="mr-2 h-4 w-4 text-green-500" />
                    <p className="text-green-500 cursor-pointer">Submit</p>
                  </div>
                </HoverCardTrigger>
                <HoverCardContent className="mr-5 p-1">
                  Submit Code
                </HoverCardContent>
              </HoverCard>
              <div className="flex justify-center items-center rounded-md p-1 bg-secondary h-8 w-auto cursor-pointer">
                <Timer />
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
              <div className="flex justify-center items-center rounded-md p-1 bg-secondary h-8 w-8 cursor-pointer">
                <Settings className="h-4 w-4" />
              </div>
              <MenubarMenu>
                {isAuthenticated ? (
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
      <FloatingDialog
        open={isAIDialogOpen}
        onOpenChange={setIsAIDialogOpen}
        title="AI Chat"
        defaultSize={{ width: 600, height: 500 }}
        enableReset={true}
      />
    </>
  );
};
export default ProblemNavbar;
