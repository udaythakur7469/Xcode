import React from "react";
import { LocateFixed } from "lucide-react";

interface RecenterButtonProps {
  onClick: () => void;
}

// Replaces the old +/- zoom buttons (zoom is now mouse-wheel only). Resets
// zoom level AND scroll position to how they were when the tree was opened.
const RecenterButton: React.FC<RecenterButtonProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      title="Recenter (reset zoom & position)"
      aria-label="Recenter tree"
      className="absolute right-5 bottom-5 w-[34px] h-[34px] flex items-center justify-center rounded-lg border border-white/10 shadow-lg bg-zinc-800 text-zinc-200 hover:bg-zinc-700 hover:text-[var(--brand)] transition-colors z-[5]"
    >
      <LocateFixed size={16} strokeWidth={2.5} />
    </button>
  );
};

export default RecenterButton;
