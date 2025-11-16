"use client";

import React, { useEffect, useState } from "react";
import { Menubar, MenubarTrigger, MenubarMenu } from "@/components/ui/menubar";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { LoginDialog } from "@/components/auth/loginPage/LoginDialog";
import { useUserStore } from "@/features/userStore";
import { ThemeToggle } from "@/components/themes/themeToggle";
import { SignupDialog } from "@/components/auth/signupPage/SignupDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import AccountDropDown from "../helperComponents/AccountDropDown";
import {
  DropdownMenu,
  DropdownMenuTrigger,
} from "@/components/ui/logout-dropdown-menu";
import { MoonLoader } from "react-spinners";

type NavbarProps = {
  firstButton: string;
  secondButton: string;
};

const Navbar: React.FC<NavbarProps> = ({ firstButton, secondButton }) => {
  const router = useRouter();
  const pathname = usePathname();

  const [isAuthChecked, setIsAuthChecked] = useState<boolean>(false);

  const goToPage = (Button: string) => {
    switch (Button) {
      case "Explore Xcode":
        return router.push("/explore");
      case "Solve Problems":
        return router.push("/problems");
      case "Mock Interviews":
        return router.push("/interview");
    }
  };

  const { checkAuth, userData, isAuthenticated } = useUserStore();

  useEffect(() => {
    const initAuth = async () => {
      await checkAuth();
      setIsAuthChecked(true);
    };
    initAuth();
  }, [checkAuth]);

  // Redirect if on account page and not authenticated
  useEffect(() => {
    if (!isAuthChecked) return; // Wait until auth check is done

    const isAccountPage = pathname?.includes("/account");
    if (isAccountPage && isAuthenticated === false) {
      console.log(
        "User not authenticated on account page, redirecting to home"
      );
      router.push("/");
    }
  }, [isAuthenticated, pathname, router, isAuthChecked]);

  const name = userData?.name;

  const picture: string | unknown = userData?.picture;
  const firstLetter = name ? name[0] : null;

  const goToHomePage = () => {
    router.push("/");
  };

  // State to control the login dialog
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSignupOpen, setIsSignupOpen] = useState(false);

  const isAccountPage = pathname?.includes("/account");
  if (!isAuthChecked && isAccountPage) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background">
        <MoonLoader color="#ffffff" size={60} />
      </div>
    );
  }

  return (
    <>
      <div className="p-5">
        <Menubar className="flex w-full items-center justify-between border shadow h-[50px]">
          {/* Logo (Left) */}
          <MenubarMenu>
            <MenubarTrigger className="h-full">
              <Image
                src="/logo.png"
                width={100}
                height={100}
                alt="logo"
                onClick={goToHomePage}
              />
            </MenubarTrigger>
          </MenubarMenu>

          {/* Centered Menu Items */}
          <div className="flex gap-8 h-full">
            <MenubarMenu>
              <MenubarTrigger
                className="h-full text-lg"
                onClick={() => goToPage(firstButton)}
              >
                <HoverCard>
                  <HoverCardTrigger>{firstButton}</HoverCardTrigger>
                  <HoverCardContent className="text-sm p-3">
                    {firstButton}
                  </HoverCardContent>
                </HoverCard>
              </MenubarTrigger>
            </MenubarMenu>
            <MenubarMenu>
              <MenubarTrigger
                className="h-full text-lg"
                onClick={() => goToPage(secondButton)}
              >
                <HoverCard>
                  <HoverCardTrigger>{secondButton}</HoverCardTrigger>
                  <HoverCardContent className="text-sm p-3">
                    {secondButton}
                  </HoverCardContent>
                </HoverCard>
              </MenubarTrigger>
            </MenubarMenu>
          </div>

          {/* Theme Toggle & Login (Right) */}
          <div className="flex items-center gap-4 px-2">
            <ThemeToggle />
            <MenubarMenu>
              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <div className="cursor-pointer">
                      <Avatar>
                        <AvatarImage src={picture || ""} />
                        <AvatarFallback>{firstLetter}</AvatarFallback>
                      </Avatar>
                    </div>
                  </DropdownMenuTrigger>
                  <AccountDropDown />
                </DropdownMenu>
              ) : (
                <MenubarTrigger
                  className="h-full text-lg"
                  onClick={() => setIsLoginOpen(true)}
                >
                  Login
                </MenubarTrigger>
              )}
            </MenubarMenu>
          </div>
        </Menubar>
      </div>
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
    </>
  );
};

export default Navbar;
