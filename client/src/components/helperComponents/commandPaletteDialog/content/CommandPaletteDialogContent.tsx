"use client";

import React, { useEffect, useRef, useState } from "react";
import CommandPaletteItem from "./commandPaletteItem/CommandPaletteItem";
import { CommandPaletteData } from "./commandPaletteData/CommandPaletteData";
import { usePathname, useRouter } from "next/navigation";
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
  const pathname = usePathname();

  const { userData, isUserAuthenticated } = useUserStore();

  const [selectedIndex, setSelectedIndex] = useState(0);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

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
    // Filter based on authentication
    if (item.type === "action") {
      if (isUserAuthenticated) {
        return item.title === "Logout";
      } else {
        return item.title === "Login" || item.title === "SignUp";
      }
    } else if (item.type === "navigation") {
      // Filter Account based on authentication
      if (item.title === "Account") {
        if (!isUserAuthenticated) return false;

        // Hide Account if on account page
        if (pathname.startsWith("/account")) return false;
      }

      // Hide Home if on home page
      if (item.title === "Home" && pathname === "/") {
        return false;
      }

      // Hide Problems if on problems page
      if (item.title === "Problems" && pathname === "/problems") {
        return false;
      }

      // Hide Two Sum if on Two Sum problem page
      if (
        item.title === "Two Sum" &&
        pathname.includes("/problems/problem-detail")
      ) {
        // Check if the URL contains Two Sum in the query
        if (typeof window !== "undefined") {
          const searchParams = new URLSearchParams(window.location.search);
          const title = searchParams.get("title");
          if (title === "Two Sum") {
            return false;
          }
        }
      }

      // Hide Interviews if on interview page
      if (item.title === "Interviews" && pathname === "/interview") {
        return false;
      }

      return true;
    }

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

  // Reset selected index when filtered commands change
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery, filteredCommands.length]);

  // Scroll selected item into view
  useEffect(() => {
    if (itemRefs.current[selectedIndex]) {
      itemRefs.current[selectedIndex]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [selectedIndex]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (filteredCommands.length === 0) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < filteredCommands.length - 1 ? prev + 1 : prev
          );
          break;

        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
          break;

        case "Enter":
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            handleItemClick(filteredCommands[selectedIndex]);
          }
          break;

        case "Home":
          e.preventDefault();
          setSelectedIndex(0);
          break;

        case "End":
          e.preventDefault();
          setSelectedIndex(filteredCommands.length - 1);
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [filteredCommands, selectedIndex]);

  return (
    <div>
      {filteredCommands.length > 0 ? (
        filteredCommands.map((item, index) => (
          <CommandPaletteItem
            key={index}
            ref={(el) => {
              itemRefs.current[index] = el;
            }}
            title={item.title}
            showLink={item.showLink}
            icon={item.logo}
            onClick={() => handleItemClick(item)}
            isActionItem={item.type === "action"}
            isSelected={index === selectedIndex}
            onMouseEnter={() => setSelectedIndex(index)}
            isFirst={index === 0}
            isLast={index === filteredCommands.length - 1}
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
