import React from "react";
import { Plus, Minus } from "lucide-react";

interface ZoomControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
}

const ZoomControls: React.FC<ZoomControlsProps> = ({ onZoomIn, onZoomOut }) => {
  return (
    <div className="absolute right-5 bottom-5 flex flex-col rounded-lg overflow-hidden border border-white/10 shadow-lg z-[5]">
      <button
        onClick={onZoomIn}
        title="Zoom in"
        className="w-[34px] h-[34px] flex items-center justify-center bg-zinc-800 text-zinc-200 hover:bg-zinc-700 hover:text-[var(--brand)] border-b border-white/10"
      >
        <Plus size={15} strokeWidth={3} />
      </button>
      <button
        onClick={onZoomOut}
        title="Zoom out"
        className="w-[34px] h-[34px] flex items-center justify-center bg-zinc-800 text-zinc-200 hover:bg-zinc-700 hover:text-[var(--brand)]"
      >
        <Minus size={15} strokeWidth={3} />
      </button>
    </div>
  );
};

export default ZoomControls;
