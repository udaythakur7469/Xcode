"use client";

import React, { useEffect, useState } from "react";
import { ShieldAlert } from "lucide-react";
import { useUserStore } from "@/features/userStore";
import { LoginDialog } from "@/components/auth/loginPage/LoginDialog";
import { SignupDialog } from "@/components/auth/signupPage/SignupDialog";
import { ForgotPasswordDialog } from "@/components/auth/forgotPasswordPage/ForgotPasswordDialog";

type InterviewAuthGateProps = { children: React.ReactNode };

/**
 * Doesn't call checkAuth() itself — AuthProvider (mounted once in the root
 * layout) owns that. This just reads the resulting state, and additionally
 * waits for isHydrated so a reload never flashes this dialog for a second
 * while the persisted session is still loading.
 */
const InterviewAuthGate: React.FC<InterviewAuthGateProps> = ({ children }) => {
  const { checkAuth, isUserAuthenticated, isCheckingUserAuth, isHydrated } =
    useUserStore();

  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSignupOpen, setIsSignupOpen] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

  const isLocked = !isHydrated || isCheckingUserAuth || !isUserAuthenticated;

  return (
    <div className="relative">
      <div
        className={
          isLocked
            ? "pointer-events-none select-none blur-[6px] opacity-60 transition-all"
            : "transition-all"
        }
        aria-hidden={isLocked}
      >
        {children}
      </div>

      {isLocked && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45">
          <div
            className="w-[min(420px,90vw)] rounded-2xl border p-7 text-center shadow-2xl"
            style={{ background: "var(--card)", borderColor: "var(--border)" }}
            role="alertdialog"
            aria-modal="true"
          >
            <div
              className="mx-auto mb-4 flex items-center justify-center rounded-2xl border"
              style={{
                background: "var(--brand-muted)",
                borderColor: "var(--brand-glow)",
                color: "var(--brand)",
                width: 52,
                height: 52,
              }}
            >
              <ShieldAlert className="size-6" />
            </div>
            <h3 className="mb-1.5 text-lg font-semibold">Login required</h3>
            <p className="mb-6 text-sm text-muted-foreground">
              You need to log in before you can generate or practice an
              interview.
            </p>

            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => setIsLoginOpen(true)}
                className="rounded-lg py-3 text-sm font-semibold text-[#08160c] transition-transform hover:-translate-y-0.5"
                style={{
                  background:
                    "linear-gradient(135deg, var(--brand), var(--brand-dim))",
                }}
              >
                Click to login
              </button>
              <div className="flex items-center justify-center gap-3.5 text-xs text-muted-foreground">
                <button
                  type="button"
                  onClick={() => setIsSignupOpen(true)}
                  className="underline hover:text-foreground"
                >
                  Create account
                </button>
                <span>·</span>
                <button
                  type="button"
                  onClick={() => setIsForgotPasswordOpen(true)}
                  className="underline hover:text-foreground"
                >
                  Forgot password
                </button>
              </div>
            </div>

            <p className="mt-4 text-[11px] text-muted-foreground/70">
              This dialog can't be dismissed — the page stays locked until
              you're signed in.
            </p>
          </div>
        </div>
      )}

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
    </div>
  );
};

export default InterviewAuthGate;
