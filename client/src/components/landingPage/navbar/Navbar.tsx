"use client";

import React, { useEffect, useState } from "react";
import { MenubarMenu, MenubarTrigger } from "@/components/ui/menubar";
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

type NavbarProps = {
  buttons: string[];
  fixed?: boolean;
  variant?: "default" | "brand";
};

const Navbar: React.FC<NavbarProps> = ({
  buttons,
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

  const rightSlot = (
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
  );

  const isAccountPage = pathname?.includes("/account");
  if (!isAuthChecked && isAccountPage) {
    return (
      <>
        <NavbarShell
          buttons={buttons}
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
      <NavbarShell
        buttons={buttons}
        goToHomePage={goToHomePage}
        goToPage={goToPage}
        rightSlot={rightSlot}
        fixed={fixed}
        variant={variant}
      />

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
