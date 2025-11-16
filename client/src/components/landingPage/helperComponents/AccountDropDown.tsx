import React, { useEffect, useState } from "react";
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/logout-dropdown-menu";
import LogoutDialog from "./LogoutDialog";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { useUserStore } from "@/features/userStore";
import { usePathname, useRouter } from "next/navigation";

type AccountDropDownProps = {};

const AccountDropDown: React.FC<AccountDropDownProps> = () => {
  const router = useRouter();
  const pathname = usePathname();

  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState<boolean>(false);
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
    <>
      <DropdownMenuContent>
        <DropdownMenuLabel>Account Options</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {showAccountButton && (
          <>
            <DropdownMenuItem onClick={goToAccountPage}>
              My account
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <Dialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
          <DialogTrigger asChild>
            <DropdownMenuItem
              onPointerDown={(event) => event.stopPropagation()}
              onSelect={(event) => {
                event.preventDefault();
                event.stopPropagation();
              }}
            >
              Log Out
            </DropdownMenuItem>
          </DialogTrigger>
          <LogoutDialog onClose={() => setIsLogoutDialogOpen(false)}/>
        </Dialog>
      </DropdownMenuContent>
    </>
  );
};
export default AccountDropDown;
