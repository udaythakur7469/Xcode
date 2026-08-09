import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { UserRoundPen, KeySquare, FilePen, LogOut } from "lucide-react";
import { useUserStore } from "@/features/userStore";
import type { CommandPaletteEntry } from "./commandPaletteTypes";

type CommandPaletteAuthItemsOptions = {
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
export function useCommandPaletteAuthItems({
  onNavigateToAccount,
  onOpenLogin,
  onOpenSignup,
  onOpenLogout,
}: CommandPaletteAuthItemsOptions): CommandPaletteEntry[] {
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

    const entries: CommandPaletteEntry[] = [];

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
