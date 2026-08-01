"use client";

import React, { useRef } from "react";
import { X } from "lucide-react";

export interface FABProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  onClose: () => void;
  position: { x: number; y: number };
  onDragStart: (e: React.MouseEvent) => void;
  isDragging: boolean;
  side: "left" | "right";
  isBeingRepelled?: boolean;
}

const FAB: React.FC<FABProps> = ({
  icon,
  label,
  onClick,
  onClose,
  position,
  onDragStart,
  isDragging,
  side,
  isBeingRepelled,
}) => {
  const dragStartPos = useRef({ x: 0, y: 0 });
  const hasDragged = useRef(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    hasDragged.current = false;
    onDragStart(e);
  };

  const handleClick = (e: React.MouseEvent) => {
    // Only trigger onClick if we haven't dragged
    const dragDistance = Math.sqrt(
      Math.pow(e.clientX - dragStartPos.current.x, 2) +
        Math.pow(e.clientY - dragStartPos.current.y, 2)
    );

    // If dragged more than 5 pixels, don't trigger click
    if (dragDistance < 5) {
      onClick();
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        left: `${position.x}px`,
        top: `${position.y}px`,
        transition: isDragging
          ? "none"
          : isBeingRepelled
          ? "all 0.1s ease-out"
          : "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        zIndex: 40,
      }}
      className="group"
    >
      <button
        onMouseDown={handleMouseDown}
        onClick={handleClick}
        className="relative w-14 h-14 rounded-full bg-gradient-to-br from-[var(--brand)] to-[var(--brand-dim)] text-white transition-transform hover:scale-[1.08] cursor-grab active:cursor-grabbing flex items-center justify-center animate-fab-glow"
        aria-label={label}
      >
        {icon}

        {/* Close button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Close"
        >
          <X size={12} />
        </button>
      </button>

      {/* Tooltip */}
      <div
        className={`absolute top-1/2 -translate-y-1/2 ${
          side === "right" ? "right-16" : "left-16"
        } bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none`}
      >
        {label}
      </div>
    </div>
  );
};

export default FAB;
