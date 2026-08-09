import React from "react";
import type { CommandBarGroup } from "../commandBarData/commandBarTypes";
import CommandBarItem from "../commandBarItem/CommandBarItem";

type CommandBarSectionProps = {
  group: CommandBarGroup;
  startIndex: number;
  totalCount: number;
  selectedIndex: number;
  setSelectedIndex: (index: number) => void;
};

const CommandBarSection: React.FC<CommandBarSectionProps> = ({
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
          <CommandBarItem
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

export default CommandBarSection;
