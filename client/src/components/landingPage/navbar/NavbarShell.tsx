import React from "react";
import { Menubar, MenubarTrigger, MenubarMenu } from "@/components/ui/menubar";
import Image from "next/image";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { cn } from "@/lib/utils";

type NavbarShellProps = {
  firstButton: string;
  secondButton: string;
  goToHomePage: () => void;
  goToPage: (button: string) => void;
  rightSlot: React.ReactNode;
  fixed?: boolean;
  variant?: "default" | "brand";
};

const NavbarShell: React.FC<NavbarShellProps> = ({
  firstButton,
  secondButton,
  goToHomePage,
  goToPage,
  rightSlot,
  fixed = false,
  variant = "default",
}) => {
  return (
    <div
      className={cn(
        fixed ? "fixed top-0 inset-x-0 z-50 px-6 py-4" : "p-5"
      )}
    >
      <Menubar
        className={cn(
          "flex w-full items-center justify-between h-[50px]",
          variant === "brand"
            ? "border-none shadow-lg bg-gradient-to-r from-brand to-brand-dim"
            : "border shadow"
        )}
        style={
          variant === "brand"
            ? { color: "var(--brand-foreground)" }
            : undefined
        }
      >
        <MenubarMenu>
          <MenubarTrigger className="h-full">
            <Image
              src="/logo.png"
              width={100}
              height={100}
              alt="logo"
              onClick={goToHomePage}
            />
          </MenubarTrigger>
        </MenubarMenu>

        <div className="flex gap-8 h-full">
          <MenubarMenu>
            <MenubarTrigger
              className="h-full text-lg"
              onClick={() => goToPage(firstButton)}
            >
              <HoverCard>
                <HoverCardTrigger>{firstButton}</HoverCardTrigger>
                <HoverCardContent className="text-sm p-3">
                  {firstButton}
                </HoverCardContent>
              </HoverCard>
            </MenubarTrigger>
          </MenubarMenu>
          <MenubarMenu>
            <MenubarTrigger
              className="h-full text-lg"
              onClick={() => goToPage(secondButton)}
            >
              <HoverCard>
                <HoverCardTrigger>{secondButton}</HoverCardTrigger>
                <HoverCardContent className="text-sm p-3">
                  {secondButton}
                </HoverCardContent>
              </HoverCard>
            </MenubarTrigger>
          </MenubarMenu>
        </div>

        {rightSlot}
      </Menubar>
    </div>
  );
};
export default NavbarShell;
