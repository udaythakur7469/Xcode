import * as React from "react";
import { useRef, useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
} from "framer-motion";
import { Maximize, Menu, Minimize, RotateCcw, X } from "lucide-react";

interface FloatingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  title?: React.ReactNode;
  dialogType: string;
  defaultSize?: { width: number; height: number };
  defaultPosition?: { x: number; y: number };
  enableReset?: boolean;
  enableMaximize?: boolean;
  enableSidebar?: boolean;
  sidebarContent?: React.ReactNode;
  defaultSidebarWidth?: number;
}

const FloatingDialog: React.FC<FloatingDialogProps> = ({
  open,
  onOpenChange,
  children,
  title,
  dialogType,
  defaultSize,
  defaultPosition = { x: 100, y: 100 },
  enableReset = false,
  enableMaximize = false,
  enableSidebar = false,
  sidebarContent,
}) => {
  const [size, setSize] = useState(defaultSize);
  const [isResizing, setIsResizing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [resizeDirection, setResizeDirection] = useState("");
  const [isMaximized, setIsMaximized] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [preMaximizeState, setPreMaximizeState] = useState<{
    size: { width: number; height: number };
    position: { x: number; y: number };
  } | null>(null);
  const [position, setPosition] = useState(() => {
    if (typeof window === "undefined") return defaultPosition;

    if (dialogType === "CommandPalette") {
      return {
        x: Math.max(0, window.innerWidth / 2 - defaultSize.width / 2),
        y: Math.max(0, window.innerHeight / 2 - defaultSize.height / 2 - 100),
      };
    }

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

  // Motion values for smooth animation
  const motionX = useMotionValue(position.x);
  const motionY = useMotionValue(position.y);
  const motionWidth = useMotionValue(size.width);
  const motionHeight = useMotionValue(size.height);

  // Spring configuration for smooth animation
  const springConfig = { stiffness: 300, damping: 30 };
  const springX = useSpring(motionX, springConfig);
  const springY = useSpring(motionY, springConfig);
  const springWidth = useSpring(motionWidth, springConfig);
  const springHeight = useSpring(motionHeight, springConfig);

  // Update motion values when position or size changes
  useEffect(() => {
    motionX.set(position.x);
    motionY.set(position.y);
  }, [position.x, position.y, motionX, motionY]);

  useEffect(() => {
    motionWidth.set(size.width);
    motionHeight.set(size.height);
  }, [size.width, size.height, motionWidth, motionHeight]);

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

  // Reposition dialog when window is resized
  const repositionOnResize = useCallback(() => {
    if (typeof window === "undefined") return;

    // Constrain size to fit within window
    setSize((prevSize) => ({
      width: Math.min(prevSize.width, window.innerWidth - 100),
      height: Math.min(prevSize.height, window.innerHeight - 100),
    }));

    // Reposition to stay within bounds
    setPosition((prevPos) => {
      const constrainedWidth = Math.min(size.width, window.innerWidth - 100);
      const constrainedHeight = Math.min(size.height, window.innerHeight - 100);

      const maxX = Math.max(50, window.innerWidth - constrainedWidth);
      const maxY = Math.max(50, window.innerHeight - constrainedHeight);

      return {
        x: Math.max(0, Math.min(prevPos.x, maxX)),
        y: Math.max(0, Math.min(prevPos.y, maxY)),
      };
    });
  }, [size.width, size.height]);

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

  // Reset to default position and size with smooth animation
  const handleReset = () => {
    if (typeof window !== "undefined") {
      const yOffset = dialogType === "CommandPalette" ? -100 : 0;
      const centeredPosition = {
        x: Math.max(0, window.innerWidth / 2 - defaultSize.width / 2),
        y: Math.max(
          0,
          window.innerHeight / 2 - defaultSize.height / 2 + yOffset
        ),
      };

      setSize(defaultSize);
      setPosition(centeredPosition);
      setIsMaximized(false);
    } else {
      setSize(defaultSize);
      setPosition(defaultPosition);
      setIsMaximized(false);
    }
  };

  // Maximize/Minimize functionality
  const handleMaximize = () => {
    if (typeof window === "undefined") return;

    if (isMaximized) {
      // Restore to previous state
      if (preMaximizeState) {
        setSize(preMaximizeState.size);
        setPosition(preMaximizeState.position);
      }
      setIsMaximized(false);
    } else {
      // Save current state before maximizing
      setPreMaximizeState({
        size: { ...size },
        position: { ...position },
      });

      // Maximize to full screen
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
      setPosition({ x: 0, y: 0 });
      setIsMaximized(true);
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

  // Handle window resize
  useEffect(() => {
    if (!open) return;

    const handleResize = () => {
      repositionOnResize();
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [open, repositionOnResize]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onOpenChange(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onOpenChange]);

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center"
        >
          <motion.div
            ref={dialogRef}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="bg-background border rounded-lg shadow-lg relative flex flex-col"
            style={{
              width: springWidth,
              height: springHeight,
              left: springX,
              top: springY,
              position: "fixed",
              pointerEvents: isResizing ? "none" : "auto",
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              if (isResizing) e.stopPropagation();
            }}
          >
            {/* Edge Handles - Extended 20px on each side */}
            {/* Left */}
            <div
              className="absolute left-1 top-1/2 -translate-y-1/2 w-1 cursor-w-resize bg-gray-300 rounded-full z-10 transition-all opacity-0 hover:opacity-100"
              style={{ height: "calc(1.5rem + 40px)" }}
              onMouseDown={(e) => handleResizeMouseDown(e, "left")}
            />
            {/* Right */}
            <div
              className="absolute right-1 top-1/2 -translate-y-1/2 w-1 cursor-e-resize bg-gray-300 rounded-full z-10 transition-all opacity-0 hover:opacity-100"
              style={{ height: "calc(1.5rem + 40px)" }}
              onMouseDown={(e) => handleResizeMouseDown(e, "right")}
            />
            {/* Top */}
            <div
              className="absolute top-1 left-1/2 -translate-x-1/2 h-1 cursor-n-resize bg-gray-300 rounded-full z-10 transition-all opacity-0 hover:opacity-100"
              style={{ width: "calc(2rem + 40px)" }}
              onMouseDown={(e) => handleResizeMouseDown(e, "top")}
            />
            {/* Bottom */}
            <div
              className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1 cursor-s-resize bg-gray-300 rounded-full z-10 transition-all opacity-0 hover:opacity-100"
              style={{ width: "calc(2rem + 40px)" }}
              onMouseDown={(e) => handleResizeMouseDown(e, "bottom")}
            />

            {/* Corner Handles */}
            {/* Top-left */}
            <div
              className="absolute left-0 top-0 cursor-nw-resize z-10 transition-all opacity-0 hover:opacity-100"
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
              className="absolute right-0 top-0 cursor-ne-resize z-10 transition-all opacity-0 hover:opacity-100"
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
              className="absolute left-0 bottom-0 cursor-sw-resize z-10 transition-all opacity-0 hover:opacity-100"
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
              className="absolute right-0 bottom-0 cursor-se-resize z-10 transition-all opacity-0 hover:opacity-100"
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
              className="cursor-move active:cursor-grabbing p-3 flex flex-row items-center justify-between"
              onMouseDown={handleDragMouseDown}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {enableSidebar && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    onMouseDown={(e) => e.stopPropagation()}
                    className="h-8 w-8 flex-shrink-0"
                    title={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
                  >
                    {isSidebarOpen ? (
                      <X strokeWidth={3} />
                    ) : (
                      <Menu strokeWidth={3} />
                    )}
                  </Button>
                )}
                <div
                  className="flex-1 min-w-0"
                  onMouseDown={(e) => {
                    if (dialogType === "CommandPalette") {
                      e.stopPropagation();
                    }
                  }}
                >
                  {title}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                {enableMaximize && (
                  <Button
                    variant="secondary"
                    onClick={handleMaximize}
                    className="text-small text-white hover:text-green-600 rounded p-2"
                    title={isMaximized ? "Minimize" : "Maximize"}
                  >
                    {isMaximized ? (
                      <Minimize strokeWidth={3} />
                    ) : (
                      <Maximize strokeWidth={3} />
                    )}
                  </Button>
                )}
                {enableReset && (
                  <Button
                    variant="secondary"
                    onClick={handleReset}
                    className="text-small text-white hover:text-yellow-600 rounded p-2"
                    title="Reset position and size"
                  >
                    <RotateCcw strokeWidth={3} />
                  </Button>
                )}
                <Button
                  variant="secondary"
                  onClick={() => onOpenChange(false)}
                  className="text-small text-red-500 hover:text-red-800 rounded p-2"
                  title="Close"
                >
                  <X strokeWidth={3} />
                </Button>
              </div>
            </div>

            {/* Content Area with Sidebar */}
            <div className="flex flex-1 overflow-hidden">
              {/* Sidebar */}
              {enableSidebar && (
                <motion.div
                  initial={false}
                  animate={{
                    width: isSidebarOpen ? `${size.width * 0.35}px` : 0,
                    opacity: isSidebarOpen ? 1 : 0,
                  }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="overflow-hidden"
                  style={{ flexShrink: 0 }}
                >
                  {isSidebarOpen && (
                    <div
                      style={{ width: `${size.width * 0.35}px` }}
                      className="h-full bg-red-500 rounded-bl-lg"
                    >
                      {sidebarContent}
                    </div>
                  )}
                </motion.div>
              )}

              {/* Main Content */}
              <div className="flex-1 overflow-auto px-2 pb-2 bg-green-500 rounded-b-lg">
                {children}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FloatingDialog;
