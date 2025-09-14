import React from "react";
import {
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdownMenu";
import { Button } from "@/components/ui/button";

type LayoutDropdownProps = { onResetLayout?: () => void };

const LayoutDropdown: React.FC<LayoutDropdownProps> = ({ onResetLayout }) => {
  const handleResetLayout = () => {
    if (onResetLayout) {
      onResetLayout();
    }
  };

  return (
    <>
      <DropdownMenuContent className="w-full">
        <DropdownMenuItem>
          <Button
            variant="ghost"
            className="p-0 m-0"
            onClick={handleResetLayout}
          >
            Reset layout
          </Button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </>
  );
};
export default LayoutDropdown;
