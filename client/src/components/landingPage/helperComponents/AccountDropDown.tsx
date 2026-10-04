import React, { useEffect, useState } from "react";
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/logout-dropdown-menu";
import { useUserStore } from "@/features/userStore";
import { usePathname, useRouter } from "next/navigation";

type AccountDropDownProps = {
  // Tells the parent (Navbar/ProblemNavbar) to open ITS OWN LogoutDialog,
  // rendered outside the isUserAuthenticated conditional. LogoutDialog used
  // to live inside this component, which itself only renders while
  // isUserAuthenticated is true - the instant logout succeeds,
  // useAuthStore's logout() calls clearUser() which flips that flag to
  // false synchronously, and React unmounted this whole subtree
  // (LogoutDialog included) before its 3-second success message ever got a
  // chance to run. Moving LogoutDialog up to the parent, rendered
  // unconditionally, fixes that - see Navbar.tsx/ProblemNavbar.tsx.
  //
  // The dropdown is now free to close normally on click (no more
  // preventDefault/stopPropagation on select) since there's no longer a
  // nested Dialog inside it that premature closing would unmount.
  onOpenLogout: () => void;
};

const AccountDropDown: React.FC<AccountDropDownProps> = ({ onOpenLogout }) => {
  const router = useRouter();
  const pathname = usePathname();

  const [showAccountButton, setShowAccountButton] = useState<boolean>(false);

  const { userData } = useUserStore();

  useEffect(() => {
    // Get the current user's account URL path
    const userAccountPath = `/account/${encodeURIComponent(
      userData?.name || ""
    )}`;

    // Hide the account button if we're already on the user's account page
    setShowAccountButton(pathname !== userAccountPath);
  }, [pathname, userData]);

  const goToAccountPage = () => {
    const name = encodeURIComponent(userData?.name || "");
    router.push(`/account/${name}`);
  };

  return (
    <DropdownMenuContent>
      <DropdownMenuLabel>Account Options</DropdownMenuLabel>
      <DropdownMenuSeparator />
      {showAccountButton && (
        <DropdownMenuItem onClick={goToAccountPage}>
          My account
        </DropdownMenuItem>
      )}
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={onOpenLogout}>Log Out</DropdownMenuItem>
    </DropdownMenuContent>
  );
};
export default AccountDropDown;
