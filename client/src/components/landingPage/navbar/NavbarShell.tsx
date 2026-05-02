import React from "react";
import { Menubar, MenubarTrigger, MenubarMenu } from "@/components/ui/menubar";
import Image from "next/image";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

type NavbarShellProps = {
  firstButton: string;
  secondButton: string;
  goToHomePage: () => void;
  goToPage: (button: string) => void;
  rightSlot: React.ReactNode;
};

const NavbarShell: React.FC<NavbarShellProps> = ({
  firstButton,
  secondButton,
  goToHomePage,
  goToPage,
  rightSlot,
}) => {
  return (
    <div className="p-5">
      <Menubar className="flex w-full items-center justify-between border shadow h-[50px]">
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
