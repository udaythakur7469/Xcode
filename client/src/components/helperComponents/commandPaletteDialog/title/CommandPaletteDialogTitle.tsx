import React from "react";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";

type CommandPaletteDialogTitleProps = {
  commandPaletteSearchQuery: string;
  handleCommandPaletteSearch: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleCommandPaletteClear: () => void;
};

const CommandPaletteDialogTitle: React.FC<CommandPaletteDialogTitleProps> = ({
  commandPaletteSearchQuery,
  handleCommandPaletteSearch,
  handleCommandPaletteClear,
}) => {
  return (
    <div className="relative w-full mr-2">
      {/* Search Icon */}
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white" />

      {/* Input Field */}
      <Input
        className="w-full border-white bg-secondary h-[40px] pl-12 pr-10 placeholder-white text-xl"
        placeholder="Search..."
        value={commandPaletteSearchQuery}
        onChange={handleCommandPaletteSearch}
      />

      {/* Clear (X) Icon */}
      {commandPaletteSearchQuery && ( // Only show the X icon if there is text in the search bar
        <X
          className="absolute right-3 top-1/2 -translate-y-1/2 text-white cursor-pointer"
          onClick={handleCommandPaletteClear}
        />
      )}
    </div>
  );
};
export default CommandPaletteDialogTitle;
