"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useUserStore } from "@/features/userStore";
import { SignupDialog } from "@/components/auth/signupPage/SignupDialog";
import { LoginDialog } from "@/components/auth/loginPage/LoginDialog";
import RevealOnScroll from "../helperComponents/RevealOnScroll";

const CTASection: React.FC = () => {
  const { checkAuth } = useUserStore();
  const [isSignupOpen, setIsSignupOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  const handleClick = () => {
    setIsSignupOpen(true);
  };

  return (
    <section className="pb-[90px]">
      <div className="max-w-[1280px] mx-auto px-6">
        <RevealOnScroll
          className="relative overflow-hidden text-center rounded-[20px] py-[70px] px-8 border"
          delay={0}
        >
          <div
            className="absolute inset-0 -z-10"
            style={{
              background:
                "linear-gradient(135deg, var(--brand-muted), transparent)",
            }}
          />
          <div
            className="absolute inset-0 -z-10 rounded-[20px]"
            style={{ boxShadow: "inset 0 0 0 1px var(--brand-glow)" }}
          />
          <h2 className="text-[1.7rem] md:text-[2.5rem] font-extrabold mb-4">
            Ready to level up your interview prep?
          </h2>
          <p className="text-muted-foreground mb-[30px]">
            Join thousands of learners already solving, practicing, and
            improving on xCode.
          </p>
          <Button
            size="lg"
            className="bg-brand text-brand-foreground hover:bg-brand-dim px-8 py-6 text-base"
            onClick={handleClick}
          >
            Create free account →
          </Button>
        </RevealOnScroll>
      </div>

      <SignupDialog
        isOpen={isSignupOpen}
        onClose={() => setIsSignupOpen(false)}
        openLogin={() => {
          setIsSignupOpen(false);
          setIsLoginOpen(true);
        }}
        onSuccessfulAuth={checkAuth}
      />
      <LoginDialog
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        openSignup={() => {
          setIsLoginOpen(false);
          setIsSignupOpen(true);
        }}
        openForgotPassword={() => setIsLoginOpen(false)}
        onSuccessfulAuth={checkAuth}
      />
    </section>
  );
};

export default CTASection;
