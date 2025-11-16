import { ChevronsRight } from "lucide-react";
import React from "react";

type CommandPaletteItemProps = {
  title: string;
  showLink: string;
  icon: React.ReactNode;
  onClick?: () => void;
  isActionItem?: boolean;
};

const CommandPaletteItem: React.FC<CommandPaletteItemProps> = ({
  title,
  showLink,
  icon,
  onClick,
  isActionItem,
}) => {
  return (
    <div
      className="w-full h-auto p-2 my-2 flex flex-row border rounded-md cursor-pointer items-center"
      onClick={onClick}
    >
      <div className="flex mr-3 ml-1">{icon}</div>
      <div className="flex flex-col">
        <div className="font-medium">{title}</div>
        <div className="flex flex-row items-center text-sm text-gray-400">
          <ChevronsRight />
          {!isActionItem && "....."}
          {showLink}
        </div>
      </div>
    </div>
  );
};
export default CommandPaletteItem;
