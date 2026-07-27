"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useUserStore } from "@/features/userStore";
import { SignupDialog } from "@/components/auth/signupPage/SignupDialog";
import { LoginDialog } from "@/components/auth/loginPage/LoginDialog";
import RevealOnScroll from "@/components/landingPage/helperComponents/RevealOnScroll";

const ExploreCTASection: React.FC = () => {
  const router = useRouter();
  const { isUserAuthenticated, checkAuth } = useUserStore();
  const [isSignupOpen, setIsSignupOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  const handleClick = () => {
    if (isUserAuthenticated) {
      router.push("/problems");
    } else {
      setIsSignupOpen(true);
    }
  };

  return (
    <section className="py-20">
      <div className="max-w-[1280px] mx-auto px-6">
        <RevealOnScroll
          className="relative overflow-hidden text-center rounded-[20px] py-16 px-8 border"
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
          <h2 className="text-[1.6rem] md:text-[2.3rem] font-extrabold mb-4">
            Ready to put it all into practice?
          </h2>
          <p className="text-muted-foreground mb-7">
            Every feature you just explored is one click away.
          </p>
          <Button
            size="lg"
            className="bg-brand text-white hover:bg-brand-dim px-8 py-6 text-base"
            onClick={handleClick}
          >
            Start Solving →
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

export default ExploreCTASection;
