"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useUserStore } from "@/features/userStore";
import { LoginDialog } from "@/components/auth/loginPage/LoginDialog";
import { SignupDialog } from "@/components/auth/signupPage/SignupDialog";
import CodeEditorMock from "./CodeEditorMock";

const HERO_TAGS = ["arrays", "dynamic programming", "graphs", "Practice interviews"];

const HeroSection: React.FC = () => {
  const router = useRouter();
  const { isUserAuthenticated, checkAuth } = useUserStore();
  const [isSignupOpen, setIsSignupOpen] = useState(false);
  const [isLoginOpenFromSignup, setIsLoginOpenFromSignup] = useState(false);

  const handleStartSolving = () => {
    if (isUserAuthenticated) {
      router.push("/problems");
    } else {
      setIsSignupOpen(true);
    }
  };

  const handleExploreXcode = () => {
    router.push("/explore");
  };

  return (
    <section id="hero" className="relative py-24 md:py-28">
      <div className="relative z-10 max-w-[1280px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-14 items-center">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border font-mono text-[0.8rem] mb-6"
            style={{
              borderColor: "var(--brand-glow)",
              background: "var(--brand-muted)",
              color: "var(--brand)",
            }}
          >
            <span className="w-[7px] h-[7px] rounded-full bg-brand animate-pulse-dot" />
            AI Mock Interviews · Smart Revision · Real-time Judging
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="text-[2.3rem] md:text-[3.6rem] font-extrabold leading-[1.12] tracking-tight mb-6"
          >
            Master coding interviews with a platform that{" "}
            <span className="text-brand">actually adapts</span> to you.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-[1.1rem] text-muted-foreground max-w-[520px] mb-8 leading-relaxed"
          >
            Solve curated problems, get instant judged feedback, practice with
            an AI interviewer, and let spaced revision make sure what you learn
            actually sticks.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="flex flex-wrap gap-3.5 mb-10"
          >
            <Button
              size="lg"
              className="bg-brand text-brand-foreground hover:bg-brand-dim px-7 py-6 text-base"
              onClick={handleStartSolving}
            >
              Start Solving →
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="px-7 py-6 text-base"
              onClick={handleExploreXcode}
            >
              Explore Xcode
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="flex flex-wrap gap-2.5"
          >
            {HERO_TAGS.map((tag) => (
              <span
                key={tag}
                className="font-mono text-xs text-muted-foreground border border-border rounded-md px-2.5 py-1.5"
              >
                {tag}
              </span>
            ))}
          </motion.div>
        </div>

        <CodeEditorMock />
      </div>

      {/* Signup dialog reused from the real auth flow — same one Navbar uses */}
      <SignupDialog
        isOpen={isSignupOpen}
        onClose={() => setIsSignupOpen(false)}
        openLogin={() => {
          setIsSignupOpen(false);
          setIsLoginOpenFromSignup(true);
        }}
        onSuccessfulAuth={checkAuth}
      />
      <LoginDialog
        isOpen={isLoginOpenFromSignup}
        onClose={() => setIsLoginOpenFromSignup(false)}
        openSignup={() => {
          setIsLoginOpenFromSignup(false);
          setIsSignupOpen(true);
        }}
        openForgotPassword={() => setIsLoginOpenFromSignup(false)}
        onSuccessfulAuth={checkAuth}
      />
    </section>
  );
};

export default HeroSection;
