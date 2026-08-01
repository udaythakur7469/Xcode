"use client";

import React from "react";
import { LoginDialog } from "@/components/auth/loginPage/LoginDialog";
import { SignupDialog } from "@/components/auth/signupPage/SignupDialog";
import { ForgotPasswordDialog } from "@/components/auth/forgotPasswordPage/ForgotPasswordDialog";

type InterviewAuthDialogsProps = {
  isLoginOpen: boolean;
  setIsLoginOpen: (v: boolean) => void;
  isSignupOpen: boolean;
  setIsSignupOpen: (v: boolean) => void;
  isForgotPasswordOpen: boolean;
  setIsForgotPasswordOpen: (v: boolean) => void;
  onSuccessfulAuth: () => void;
};

const InterviewAuthDialogs: React.FC<InterviewAuthDialogsProps> = ({
  isLoginOpen,
  setIsLoginOpen,
  isSignupOpen,
  setIsSignupOpen,
  isForgotPasswordOpen,
  setIsForgotPasswordOpen,
  onSuccessfulAuth,
}) => {
  return (
    <>
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
        onSuccessfulAuth={onSuccessfulAuth}
      />
      <SignupDialog
        isOpen={isSignupOpen}
        onClose={() => setIsSignupOpen(false)}
        openLogin={() => {
          setIsSignupOpen(false);
          setIsLoginOpen(true);
        }}
        onSuccessfulAuth={onSuccessfulAuth}
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

export default InterviewAuthDialogs;
