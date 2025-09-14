import { Button } from "@/components/ui/button";
import * as React from "react";
import { useRef, useState, useEffect, useCallback } from "react";

interface FloatingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  title?: string;
  defaultSize?: { width: number; height: number };
  defaultPosition?: { x: number; y: number };
  enableReset?: boolean;
}

const FloatingDialog: React.FC<FloatingDialogProps> = ({
  open,
  onOpenChange,
  children,
  title,
  defaultSize = { width: 500, height: 300 },
  defaultPosition = { x: 100, y: 100 },
  enableReset = false,
}) => {
  const [size, setSize] = useState(defaultSize);
  const [isResizing, setIsResizing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [resizeDirection, setResizeDirection] = useState("");
  const [position, setPosition] = useState(() => {
    if (typeof window === "undefined") return defaultPosition;

    return {
      x: Math.max(0, window.innerWidth / 2 - defaultSize.width / 2),
      y: Math.max(0, window.innerHeight / 2 - defaultSize.height / 2),
    };
  });
  const dialogRef = useRef<HTMLDivElement>(null);
  const startPos = useRef({ x: 0, y: 0 });
  const startSize = useRef({ width: 0, height: 0 });
  const startPosition = useRef({ x: 0, y: 0 });
  const dragOffset = useRef({ x: 0, y: 0 });

  // Boundary-aware position setter
  const setBoundaryPosition = useCallback(
    (newPos: { x: number; y: number }) => {
      if (typeof window === "undefined") {
        setPosition(newPos);
        return;
      }

      const maxX = Math.max(50, window.innerWidth - size.width);
      const maxY = Math.max(50, window.innerHeight - size.height);

      setPosition({
        x: Math.max(0, Math.min(newPos.x, maxX)),
        y: Math.max(0, Math.min(newPos.y, maxY)),
      });
    },
    [size.width, size.height]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isResizing) {
        const deltaX = e.clientX - startPos.current.x;
        const deltaY = e.clientY - startPos.current.y;

        let newWidth = startSize.current.width;
        let newHeight = startSize.current.height;
        let newX = startPosition.current.x;
        let newY = startPosition.current.y;

        if (resizeDirection.includes("right")) {
          newWidth = Math.max(300, startSize.current.width + deltaX);
        }
        if (resizeDirection.includes("left")) {
          newWidth = Math.max(300, startSize.current.width - deltaX);
          newX = startPosition.current.x + deltaX;
        }
        if (resizeDirection.includes("bottom")) {
          newHeight = Math.max(200, startSize.current.height + deltaY);
        }
        if (resizeDirection.includes("top")) {
          newHeight = Math.max(200, startSize.current.height - deltaY);
          newY = startPosition.current.y + deltaY;
        }

        setSize({ width: newWidth, height: newHeight });

        if (
          resizeDirection.includes("left") ||
          resizeDirection.includes("top")
        ) {
          setBoundaryPosition({ x: newX, y: newY });
        }
      } else if (isDragging) {
        const newX = e.clientX - dragOffset.current.x;
        const newY = e.clientY - dragOffset.current.y;
        setBoundaryPosition({ x: newX, y: newY });
      }
    },
    [isResizing, isDragging, resizeDirection, setBoundaryPosition]
  );

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
    setIsDragging(false);
    setResizeDirection("");
  }, []);

  const handleResizeMouseDown = (e: React.MouseEvent, direction: string) => {
    e.stopPropagation();
    e.preventDefault();

    setIsResizing(true);
    setResizeDirection(direction);
    startPos.current = { x: e.clientX, y: e.clientY };
    startSize.current = { width: size.width, height: size.height };
    startPosition.current = { x: position.x, y: position.y };
  };

  const handleDragMouseDown = (e: React.MouseEvent) => {
    if (isResizing) return;

    e.preventDefault();
    setIsDragging(true);

    const rect = dialogRef.current?.getBoundingClientRect();
    if (rect) {
      dragOffset.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  };

  // Reset to default position and size
  const handleReset = () => {
    if (typeof window !== "undefined") {
      const centeredPosition = {
        x: Math.max(0, window.innerWidth / 2 - defaultSize.width / 2),
        y: Math.max(0, window.innerHeight / 2 - defaultSize.height / 2),
      };
      setSize(defaultSize);
      setPosition(centeredPosition);
    } else {
      setSize(defaultSize);
      setPosition(defaultPosition);
    }
  };

  useEffect(() => {
    if (isResizing || isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isResizing, isDragging, handleMouseMove, handleMouseUp]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onOpenChange(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onOpenChange]);

  // Calculate content height based on actual header height
  const headerHeight = 80;
  const contentHeight = `calc(100% - ${headerHeight}px)`;

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center"
    >
      <div
        ref={dialogRef}
        className="bg-background border rounded-lg shadow-lg relative"
        style={{
          width: `${size.width}px`,
          height: `${size.height}px`,
          left: `${position.x}px`,
          top: `${position.y}px`,
          position: "fixed",
          pointerEvents: isResizing ? "none" : "auto",
        }}
        onMouseDown={(e) => {
          e.stopPropagation(); // Prevent overlay click when clicking on dialog
          if (isResizing) e.stopPropagation();
        }}
      >
        {/* Edge Handles */}
        {/* Left */}
        <div
          className="absolute left-1 top-1/2 -translate-y-1/2 h-8 w-1 cursor-w-resize bg-gray-300 rounded-full z-10"
          onMouseDown={(e) => handleResizeMouseDown(e, "left")}
        />
        {/* Right */}
        <div
          className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-1 cursor-e-resize bg-gray-300 rounded-full z-10"
          onMouseDown={(e) => handleResizeMouseDown(e, "right")}
        />
        {/* Top */}
        <div
          className="absolute top-1 left-1/2 -translate-x-1/2 w-8 h-1 cursor-n-resize bg-gray-300 rounded-full z-10"
          onMouseDown={(e) => handleResizeMouseDown(e, "top")}
        />
        {/* Bottom */}
        <div
          className="absolute bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 cursor-s-resize bg-gray-300 rounded-full z-10"
          onMouseDown={(e) => handleResizeMouseDown(e, "bottom")}
        />

        {/* Corner Handles */}
        {/* Top-left */}
        <div
          className="absolute left-0 top-0 cursor-nw-resize z-10"
          onMouseDown={(e) => handleResizeMouseDown(e, "top-left")}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M6 6H18M6 6V18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>
        {/* Top-right */}
        <div
          className="absolute right-0 top-0 cursor-ne-resize z-10"
          onMouseDown={(e) => handleResizeMouseDown(e, "top-right")}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M18 6H6M18 6V18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>
        {/* Bottom-left */}
        <div
          className="absolute left-0 bottom-0 cursor-sw-resize z-10"
          onMouseDown={(e) => handleResizeMouseDown(e, "bottom-left")}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M6 18H18M6 18V6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>
        {/* Bottom-right */}
        <div
          className="absolute right-0 bottom-0 cursor-se-resize z-10"
          onMouseDown={(e) => handleResizeMouseDown(e, "bottom-right")}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M18 18H6M18 18V6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Header */}
        <div
          className="cursor-move active:cursor-grabbing p-6 pb-4 flex justify-between items-start border-b"
          onMouseDown={handleDragMouseDown}
        >
          <h2 className="flex-1 text-lg font-semibold">{title}</h2>
          <div className="flex items-center gap-2">
            {enableReset && (
              <Button
                variant="secondary"
                onClick={handleReset}
                className="text-small text-white hover:text-green-600 rounded"
                title="Reset position and size"
              >
                Reset
              </Button>
            )}
            <Button
              variant="secondary"
              onClick={() => onOpenChange(false)}
              className="text-small text-white hover:text-red-500 rounded p-2"
              title="Close"
            >
              ✕
            </Button>
          </div>
        </div>

        {/* Content */}
        <div
          className="overflow-auto px-6 pb-6"
          style={{ height: contentHeight }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export default FloatingDialog;
