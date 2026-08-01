"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { useUserStore } from "@/features/userStore";

type AccountAuthGateProps = { children: React.ReactNode };

const REDIRECT_SECONDS = 3;

/**
 * Blocks /account/[name] for signed-out users: page content sits blurred
 * and non-interactive behind a fixed, non-dismissible dialog telling them
 * to log in or sign up. No login form here — after REDIRECT_SECONDS the
 * user is sent back with router.back().
 */
const AccountAuthGate: React.FC<AccountAuthGateProps> = ({ children }) => {
  const router = useRouter();
  const { checkAuth, isUserAuthenticated, isCheckingUserAuth } = useUserStore();

  const [hasBeenAuthenticated, setHasBeenAuthenticated] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(REDIRECT_SECONDS);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (isUserAuthenticated) setHasBeenAuthenticated(true);
  }, [isUserAuthenticated]);

  const isLocked = hasBeenAuthenticated
    ? false
    : isCheckingUserAuth || !isUserAuthenticated;

  // Countdown + redirect, only once we're sure the user isn't authenticated
  // (i.e. the initial check has finished and failed).
  useEffect(() => {
    if (!isLocked || isCheckingUserAuth) return;

    setSecondsLeft(REDIRECT_SECONDS);
    const interval = setInterval(() => {
      setSecondsLeft((s) => Math.max(s - 1, 0));
    }, 1000);
    const timeout = setTimeout(() => {
      router.back();
    }, REDIRECT_SECONDS * 1000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [isLocked, isCheckingUserAuth, router]);

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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm">
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
            <p className="mb-1.5 text-sm text-muted-foreground">
              Please login or signup to access your account.
            </p>
            {!isCheckingUserAuth && (
              <p className="text-xs text-muted-foreground/70">
                Redirecting you back in {secondsLeft}s…
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountAuthGate;
