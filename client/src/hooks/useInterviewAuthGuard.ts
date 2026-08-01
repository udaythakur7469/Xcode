"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/features/userStore";

/**
 * Used by every "Take interview" / "Start an interview" style button.
 * Auth is checked (or re-checked) right at click time, before we ever
 * navigate — so by the time /practice-interview or /generate-interview
 * mounts, useUserStore already has a resolved isUserAuthenticated value
 * (the store is shared across client-side navigations) and
 * InterviewAuthGate never has to show its loading/blocking state.
 */
export const useInterviewAuthGuard = () => {
  const router = useRouter();
  const { checkAuth } = useUserStore();

  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSignupOpen, setIsSignupOpen] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [pendingPath, setPendingPath] = useState<string | null>(null);

  const goToInterview = useCallback(
    async (path: string) => {
      await checkAuth().catch(() => {});

      if (useUserStore.getState().isUserAuthenticated) {
        router.push(path);
      } else {
        setPendingPath(path);
        setIsLoginOpen(true);
      }
    },
    [checkAuth, router],
  );

  // Passed as onSuccessfulAuth to Login/Signup dialogs — re-confirms auth,
  // closes whichever dialog was open, then continues on to the page the
  // user originally clicked toward.
  const onSuccessfulAuth = useCallback(async () => {
    await checkAuth().catch(() => {});
    setIsLoginOpen(false);
    setIsSignupOpen(false);
    setIsForgotPasswordOpen(false);
    if (pendingPath) {
      router.push(pendingPath);
      setPendingPath(null);
    }
  }, [checkAuth, pendingPath, router]);

  return {
    goToInterview,
    isLoginOpen,
    setIsLoginOpen,
    isSignupOpen,
    setIsSignupOpen,
    isForgotPasswordOpen,
    setIsForgotPasswordOpen,
    onSuccessfulAuth,
  };
};
