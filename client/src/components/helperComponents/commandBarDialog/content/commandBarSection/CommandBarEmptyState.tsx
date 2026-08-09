import React from "react";
import { SearchX } from "lucide-react";

type CommandBarEmptyStateProps = {
  searchQuery: string;
};

const CommandBarEmptyState: React.FC<CommandBarEmptyStateProps> = ({
  searchQuery,
}) => {
  return (
    <div className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground">
      <SearchX size={22} className="opacity-60" />
      <p className="text-sm">No commands found for &quot;{searchQuery}&quot;</p>
    </div>
  );
};

export default CommandBarEmptyState;
