import React from "react";
import type { CommandPaletteGroup } from "../commandPaletteData/commandPaletteTypes";
import CommandPaletteItem from "../commandPaletteItem/CommandPaletteItem";

type CommandPaletteSectionProps = {
  group: CommandPaletteGroup;
  startIndex: number;
  totalCount: number;
  selectedIndex: number;
  setSelectedIndex: (index: number) => void;
};

const CommandPaletteSection: React.FC<CommandPaletteSectionProps> = ({
  group,
  startIndex,
  totalCount,
  selectedIndex,
  setSelectedIndex,
}) => {
  if (group.items.length === 0) return null;

  return (
    <div>
      <div className="px-2 pb-1 pt-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground first:pt-1">
        {group.label}
      </div>
      {group.items.map((entry, indexInGroup) => {
        const flatIndex = startIndex + indexInGroup;
        return (
          <CommandPaletteItem
            key={entry.id}
            entry={entry}
            isSelected={flatIndex === selectedIndex}
            onMouseEnter={() => setSelectedIndex(flatIndex)}
            isFirst={flatIndex === 0}
            isLast={flatIndex === totalCount - 1}
          />
        );
      })}
    </div>
  );
};

export default CommandPaletteSection;
