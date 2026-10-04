import { useEffect, useRef } from "react";
import { useUserStore } from "@/features/userStore";

// Runs the app-wide identity check exactly once, plus a revalidation on tab
// focus. This is the ONLY place that should call checkAuth() on mount -
// every gate/navbar/guard elsewhere reads isUserAuthenticated /
// isCheckingUserAuth / isHydrated from the store instead of calling
// checkAuth() itself. See AuthProvider.tsx for where this gets mounted.
//
// Pulled out into its own hook (rather than inlined in AuthProvider) so the
// "when do we check auth" policy is testable/reusable on its own, separate
// from the provider's job of just wiring it into the tree.
export function useAuthInit() {
  const checkAuth = useUserStore((state) => state.checkAuth);
  const isHydrated = useUserStore((state) => state.isHydrated);
  const hasRunInitialCheck = useRef(false);

  useEffect(() => {
    // Wait for zustand/persist to finish reading localStorage first, so the
    // optimistic userData from a previous session is already in the store
    // before we kick off the network revalidation on top of it.
    if (!isHydrated || hasRunInitialCheck.current) return;

    hasRunInitialCheck.current = true;
    checkAuth();
  }, [isHydrated, checkAuth]);

  useEffect(() => {
    const revalidateOnFocus = () => {
      if (document.visibilityState === "visible") {
        checkAuth();
      }
    };

    window.addEventListener("visibilitychange", revalidateOnFocus);
    return () => {
      window.removeEventListener("visibilitychange", revalidateOnFocus);
    };
  }, [checkAuth]);
}
