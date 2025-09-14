"use client";

import React, { useState } from "react";
import { UserPlus, UserRoundPen } from "lucide-react";
import { LoginDialog } from "@/components/auth/loginPage/LoginDialog";
import { SignupDialog } from "@/components/auth/signupPage/SignupDialog";
import { Button } from "@/components/ui/button";

type FooterPageProps = {};

const FooterPage: React.FC<FooterPageProps> = () => {
  // State to control the login dialog
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  // State to control the signup dialog
  const [isSignupOpen, setIsSignupOpen] = useState(false);

  return (
    <>
      <div
        id="footer"
        className="h-screen w-full flex flex-col items-center justify-center"
      >
        {/* Heading Section */}
        <div className="basis-1/3 h-full w-full flex flex-col items-center justify-between p-10">
          <div className="p-5" />
          <h1 className="font-bold text-8xl text-center">
            Get started with Xcode today
          </h1>
        </div>

        {/* Paragraph Section */}
        <div className="basis-1/3 h-full w-full flex flex-col items-center justify-center p-10">
          <p className="text-lg font-bold text-center w-1/2 ">
            No matter which company you aspire to join, we equip you with the
            ultimate resources, expert guidance, and a comprehensive preparation
            platform to tackle even the toughest challenges.
          </p>
        </div>

        {/* Buttons Section */}
        <div className="basis-1/3 h-full w-full flex flex-col items-center justify-center p-10">
          {/* Buttons Container */}
          <div className="flex flex-row justify-center items-center gap-x-4 w-full max-w-md">
            <Button
              variant="outline"
              className="w-1/2 p-7 text-lg border-2 border-white shadow"
              onClick={() => setIsSignupOpen(true)}
            >
              <UserPlus /> Sign Up for free
            </Button>
            <Button
              variant="outline"
              className="w-1/2 p-7 text-lg border-2 border-white shadow"
              onClick={() => setIsLoginOpen(true)}
            >
              <UserRoundPen /> Login
            </Button>
          </div>
          <div className="p-10 gap-y-5" />
        </div>
      </div>
      {/* Login Dialog */}
      {/* Login Dialog */}
      <LoginDialog
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        openSignup={() => {
          setIsLoginOpen(false);
          setIsSignupOpen(true);
        }}
      />

      {/* Signup Dialog */}
      <SignupDialog
        isOpen={isSignupOpen}
        onClose={() => setIsSignupOpen(false)}
        openLogin={() => {
          setIsSignupOpen(false);
          setIsLoginOpen(true);
        }}
      />
    </>
  );
};
export default FooterPage;
