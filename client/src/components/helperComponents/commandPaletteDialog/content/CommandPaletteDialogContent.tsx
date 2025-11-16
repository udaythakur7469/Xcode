"use client";

import React from "react";
import CommandPaletteItem from "./commandPaletteItem/CommandPaletteItem";
import { CommandPaletteData } from "./commandPaletteData/CommandPaletteData";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/features/authStore";
import { useUserStore } from "@/features/userStore";

type CommandPaletteDialogContentProps = {
  onClose: () => void;
  onOpenLogin: () => void;
  onOpenSignup: () => void;
  onOpenLogout: () => void;
  searchQuery?: string;
};

const CommandPaletteDialogContent: React.FC<
  CommandPaletteDialogContentProps
> = ({
  onClose,
  onOpenLogin,
  onOpenSignup,
  onOpenLogout,
  searchQuery = "",
}) => {
  const router = useRouter();

  const { isAuthenticated } = useAuthStore();
  const { userData } = useUserStore();

  const userName = userData?.name;

  const handleItemClick = (item: (typeof CommandPaletteData)[0]) => {
    if (item.type === "navigation") {
      let finalLink = item.link;

      // Handle dynamic route parameters
      if (item.link.includes("[name]") && userName) {
        finalLink = item.link.replace("[name]", userName);
      }

      router.push(finalLink);
      onClose?.();
    } else if (item.type === "action") {
      // Handle specific actions based on title
      if (item.title === "Login") {
        onClose?.();
        onOpenLogin();
      } else if (item.title === "SignUp") {
        onClose?.();
        onOpenSignup();
      } else if (item.title === "Logout") {
        onClose?.();
        onOpenLogout();
      }
    }
  };

  // Filter the data based on authentication status
  const filteredData = CommandPaletteData.filter((item) => {
    if (item.type === "action") {
      if (isAuthenticated) {
        // When authenticated, show only Logout, hide Login and SignUp
        return item.title === "Logout";
      } else {
        // When not authenticated, show only Login and SignUp, hide Logout
        return item.title === "Login" || item.title === "SignUp";
      }
    } else if (item.type === "navigation") {
      // For navigation items, hide "Account" when not authenticated
      if (item.title === "Account") {
        return isAuthenticated; // Only show Account if authenticated
      }
      // Show all other navigation items
      return true;
    }
    // Always show navigation items
    return true;
  });

  // Filter commands based on search query
  const filteredCommands = filteredData.filter((item) => {
    const searchLower = searchQuery.toLowerCase().trim();

    if (!searchLower) {
      return true; // Show all if no search query
    }

    // Search in title and showLink
    return (
      item.title.toLowerCase().includes(searchLower) ||
      item.showLink.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div>
      {filteredCommands.length > 0 ? (
        filteredCommands.map((item, index) => (
          <CommandPaletteItem
            key={index}
            title={item.title}
            showLink={item.showLink}
            icon={item.logo}
            onClick={() => handleItemClick(item)}
            isActionItem={item.type === "action"}
          />
        ))
      ) : (
        <div className="text-center py-8 text-gray-400">
          No commands found for &quot;{searchQuery}&quot;
        </div>
      )}
    </div>
  );
};
export default CommandPaletteDialogContent;
