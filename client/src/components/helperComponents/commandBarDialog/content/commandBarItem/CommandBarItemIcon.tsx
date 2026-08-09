import React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type CommandBarItemIconProps = {
  icon: LucideIcon;
  isSelected: boolean;
};

const CommandBarItemIcon: React.FC<CommandBarItemIconProps> = ({
  icon: Icon,
  isSelected,
}) => {
  return (
    <div
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-md transition-colors duration-150",
        isSelected
          ? "bg-white/20 text-[var(--brand-foreground)]"
          : "bg-secondary text-muted-foreground",
      )}
    >
      <Icon size={17} />
    </div>
  );
};

export default CommandBarItemIcon;
