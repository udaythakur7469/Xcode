"use client";

import React, { useEffect, useState } from "react";
import { Menubar, MenubarTrigger, MenubarMenu } from "@/components/ui/menubar";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LoginDialog } from "@/components/auth/loginPage/LoginDialog";
import { useUserStore } from "@/features/userStore";
import { ThemeToggle } from "@/components/themes/themeToggle";
import { SignupDialog } from "@/components/auth/signupPage/SignupDialog";
import { ForgotPasswordDialog } from "@/components/auth/forgotPasswordPage/ForgotPasswordDialog";
import { ResetPasswordDialog } from "@/components/auth/resetPasswordPage/ResetPasswordDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import AccountDropDown from "../helperComponents/AccountDropDown";
import {
  DropdownMenu,
  DropdownMenuTrigger,
} from "@/components/ui/logout-dropdown-menu";
import { UserProfileSkeleton } from "@/components/accountPage/UserProfileSkeleton";
import NavbarShell from "./NavbarShell";
import { cn } from "@/lib/utils";

type NavbarProps = {
  firstButton: string;
  secondButton: string;
  fixed?: boolean;
  variant?: "default" | "brand";
};

const Navbar: React.FC<NavbarProps> = ({
  firstButton,
  secondButton,
  fixed = false,
  variant = "default",
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isAuthChecked, setIsAuthChecked] = useState<boolean>(false);

  // Dialog open/close state
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSignupOpen, setIsSignupOpen] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);

  // The token read from ?resetToken= — kept in state so the dialog
  // can use it even after we clear it from the URL
  const [resetToken, setResetToken] = useState<string>("");

  const { checkAuth, userData, isUserAuthenticated } = useUserStore();

  // ── Auth init ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const initAuth = async () => {
      await checkAuth();
      setIsAuthChecked(true);
    };
    initAuth();
  }, [checkAuth]);

  // ── Auto-open ResetPasswordDialog when ?resetToken= is in the URL ───────────
  // This is how the "Reset my password" email link lands back on the homepage:
  //   Email link → GET /?resetToken=abc123
  //   Navbar detects the param → saves token to state → opens ResetPasswordDialog
  //   After success → router.replace('/') strips the token from the URL
  useEffect(() => {
    const token = searchParams.get("resetToken");
    if (token) {
      setResetToken(token);
      setIsResetPasswordOpen(true);
      // Strip the token from the URL immediately so a page refresh
      // doesn't re-open the dialog with an already-used token
      router.replace("/");
    }
  }, [searchParams, router]);

  // ── Redirect unauthenticated users away from /account ──────────────────────
  useEffect(() => {
    if (!isAuthChecked) return;
    const isAccountPage = pathname?.includes("/account");
    if (isAccountPage && isUserAuthenticated === false) {
      router.push("/");
    }
  }, [isUserAuthenticated, pathname, router, isAuthChecked]);

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

  const name = userData?.name;
  const picture: string | unknown = userData?.picture;
  const firstLetter = name ? name[0] : null;

  const goToHomePage = () => router.push("/");

  const isAccountPage = pathname?.includes("/account");
  if (!isAuthChecked && isAccountPage) {
    return (
      <>
        <NavbarShell
          firstButton={firstButton}
          secondButton={secondButton}
          goToHomePage={goToHomePage}
          goToPage={goToPage}
          rightSlot={<div className="w-8 h-8" />}
          fixed={fixed}
          variant={variant}
        />
        <UserProfileSkeleton />
      </>
    );
  }

  return (
    <>
      <div
        className={cn(
          fixed ? "fixed top-0 inset-x-0 z-50 px-6 py-4" : "p-5"
        )}
      >
        <Menubar
          className={cn(
            "flex w-full items-center justify-between h-[50px]",
            variant === "brand"
              ? "border-none shadow-lg bg-gradient-to-r from-brand to-brand-dim"
              : "border shadow"
          )}
          style={
            variant === "brand"
              ? { color: "var(--brand-foreground)" }
              : undefined
          }
        >
          {/* Logo */}
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

          {/* Nav links */}
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

          {/* Right side */}
          <div className="flex items-center gap-4 px-2">
            <ThemeToggle />
            <MenubarMenu>
              {isUserAuthenticated ? (
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

      {/* Login dialog */}
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

      {/* Signup dialog */}
      <SignupDialog
        isOpen={isSignupOpen}
        onClose={() => setIsSignupOpen(false)}
        openLogin={() => {
          setIsSignupOpen(false);
          setIsLoginOpen(true);
        }}
        onSuccessfulAuth={checkAuth}
      />

      {/* Forgot password dialog */}
      <ForgotPasswordDialog
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
        openLogin={() => {
          setIsForgotPasswordOpen(false);
          setIsLoginOpen(true);
        }}
      />

      {/* Reset password dialog — auto-opened by ?resetToken= in URL */}
      <ResetPasswordDialog
        isOpen={isResetPasswordOpen}
        token={resetToken}
        onClose={() => setIsResetPasswordOpen(false)}
        openLogin={() => {
          setIsResetPasswordOpen(false);
          setIsLoginOpen(true);
        }}
      />
    </>
  );
};

export default Navbar;
