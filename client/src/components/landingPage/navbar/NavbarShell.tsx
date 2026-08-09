import React, { useEffect, useState } from "react";
import { Menubar, MenubarTrigger, MenubarMenu } from "@/components/ui/menubar";
import Image from "next/image";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";

type NavbarShellProps = {
  buttons: string[];
  goToHomePage: () => void;
  goToPage: (button: string) => void;
  rightSlot: React.ReactNode;
  fixed?: boolean;
  variant?: "default" | "brand";
};

const NavbarShell: React.FC<NavbarShellProps> = ({
  buttons,
  goToHomePage,
  goToPage,
  rightSlot,
  fixed = false,
  variant = "default",
}) => {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const logoSrc =
    mounted && resolvedTheme === "dark"
      ? "/logo-dark-bg.svg"
      : "/logo-light-bg.svg";

  return (
    <div className={cn(fixed ? "fixed top-0 inset-x-0 z-50 px-6 py-4" : "p-5")}>
      <Menubar
        className={cn(
          "flex w-full items-center justify-between h-[50px]",
          variant === "brand"
            ? "border-none shadow-lg bg-gradient-to-r from-brand to-brand-dim"
            : "border shadow",
        )}
        style={
          variant === "brand" ? { color: "var(--brand-foreground)" } : undefined
        }
      >
        <MenubarMenu>
          <MenubarTrigger className="h-full">
            <Image
              src={logoSrc}
              width={100}
              height={100}
              alt="logo"
              onClick={goToHomePage}
            />
          </MenubarTrigger>
        </MenubarMenu>

        <div className="flex gap-8 h-full">
          {(buttons ?? []).map((button) => (
            <MenubarMenu key={button}>
              <MenubarTrigger
                className="h-full text-lg"
                onClick={() => goToPage(button)}
              >
                <HoverCard>
                  <HoverCardTrigger>{button}</HoverCardTrigger>
                  <HoverCardContent className="text-sm p-3">
                    {button}
                  </HoverCardContent>
                </HoverCard>
              </MenubarTrigger>
            </MenubarMenu>
          ))}
        </div>

        {rightSlot}
      </Menubar>
    </div>
  );
};
export default NavbarShell;
