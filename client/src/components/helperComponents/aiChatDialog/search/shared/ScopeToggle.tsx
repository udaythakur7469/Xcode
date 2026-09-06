import React from "react";
import { SearchScope } from "@/features/chatStore";

interface ScopeToggleProps {
  scope: SearchScope;
  onChange: (scope: SearchScope) => void;
}

const ScopeToggle: React.FC<ScopeToggleProps> = ({ scope, onChange }) => {
  return (
    <div className="flex bg-zinc-800 rounded-lg p-0.5 gap-0.5">
      <button
        onClick={() => onChange("chat")}
        className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors ${
          scope === "chat"
            ? "bg-[var(--brand)] text-white"
            : "text-zinc-400 hover:text-zinc-200"
        }`}
      >
        This Chat
      </button>
      <button
        onClick={() => onChange("all")}
        className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors ${
          scope === "all"
            ? "bg-[var(--brand)] text-white"
            : "text-zinc-400 hover:text-zinc-200"
        }`}
      >
        All Chats
      </button>
    </div>
  );
};

export default ScopeToggle;
