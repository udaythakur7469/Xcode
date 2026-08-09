import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { UserRoundPen, KeySquare, FilePen, LogOut } from "lucide-react";
import { useUserStore } from "@/features/userStore";
import type { CommandBarEntry } from "./commandBarTypes";

type CommandBarAuthItemsOptions = {
  onNavigateToAccount: () => void;
  onOpenLogin: () => void;
  onOpenSignup: () => void;
  onOpenLogout: () => void;
};

/**
 * Signed out -> Login, SignUp only.
 * Signed in  -> Account, Logout only (Account hides itself while already
 * on the account page, same as before).
 */
export function useCommandBarAuthItems({
  onNavigateToAccount,
  onOpenLogin,
  onOpenSignup,
  onOpenLogout,
}: CommandBarAuthItemsOptions): CommandBarEntry[] {
  const pathname = usePathname();
  const { isUserAuthenticated } = useUserStore();

  return useMemo(() => {
    if (!isUserAuthenticated) {
      return [
        {
          id: "auth-login",
          title: "Login",
          subtitle: "Open Login Dialog",
          icon: KeySquare,
          kind: "auth",
          onSelect: onOpenLogin,
        },
        {
          id: "auth-signup",
          title: "SignUp",
          subtitle: "Open Signup Dialog",
          icon: FilePen,
          kind: "auth",
          onSelect: onOpenSignup,
        },
      ];
    }

    const entries: CommandBarEntry[] = [];

    if (!pathname.startsWith("/account")) {
      entries.push({
        id: "auth-account",
        title: "Account",
        subtitle: "/account",
        icon: UserRoundPen,
        kind: "auth",
        onSelect: onNavigateToAccount,
      });
    }

    entries.push({
      id: "auth-logout",
      title: "Logout",
      subtitle: "Sign out of account",
      icon: LogOut,
      kind: "auth",
      onSelect: onOpenLogout,
    });

    return entries;
  }, [
    isUserAuthenticated,
    pathname,
    onNavigateToAccount,
    onOpenLogin,
    onOpenSignup,
    onOpenLogout,
  ]);
}
