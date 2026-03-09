"use client";

// ─────────────────────────────────────────────────────────────
// StickyNotesFloatingDialog
// Place at: src/components/stickyNotes/StickyNotesFloatingDialog.tsx
//
// Renders via ReactDOM.createPortal into document.body so that
// `position: fixed` is always relative to the true viewport —
// not to any ancestor element that has a CSS transform, filter,
// or perspective applied (which would break fixed positioning).
// ─────────────────────────────────────────────────────────────

import * as React from "react";
import { useRef, useState, useEffect, useCallback } from "react";
import ReactDOM from "react-dom";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
} from "framer-motion";
import { Maximize, Minimize, RotateCcw, X } from "lucide-react";

export const STICKY_NOTE_DEFAULT_WIDTH = 420;
export const STICKY_NOTE_DEFAULT_HEIGHT = 300;

// clientWidth/clientHeight excludes the scrollbar — window.innerWidth does not.
// Using clientWidth prevents the ~15px right-overflow on maximize.
function getViewport() {
  if (typeof document === "undefined") return { w: 800, h: 600 };
  return {
    w: document.documentElement.clientWidth,
    h: document.documentElement.clientHeight,
  };
}

interface StickyNotesFloatingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  title?: string;
  defaultSize?: { width: number; height: number };
  defaultPosition?: { x: number; y: number };
  zIndex?: number;
  onFocus?: () => void;
  onPositionChange?: (x: number, y: number) => void;
  onSizeChange?: (width: number, height: number) => void;
  headerActions?: React.ReactNode;
  bgColor?: string;
  headerBgColor?: string;
  textColor?: string;
}

const StickyNotesFloatingDialog: React.FC<StickyNotesFloatingDialogProps> = ({
  open,
  onOpenChange,
  children,
  title,
  defaultSize = {
    width: STICKY_NOTE_DEFAULT_WIDTH,
    height: STICKY_NOTE_DEFAULT_HEIGHT,
  },
  defaultPosition = { x: 100, y: 100 },
  zIndex = 50,
  onFocus,
  onPositionChange,
  onSizeChange,
  headerActions,
  bgColor,
  headerBgColor,
  textColor,
}) => {
  const [size, setSize] = useState(defaultSize);
  const [position, setPosition] = useState(defaultPosition);
  const [isResizing, setIsResizing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [resizeDirection, setResizeDirection] = useState("");
  const [isMaximized, setIsMaximized] = useState(false);
  const [preMaximizeState, setPreMaximizeState] = useState<{
    size: { width: number; height: number };
    position: { x: number; y: number };
  } | null>(null);

  // Portal target — only exists on the client
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  useEffect(() => {
    setPortalTarget(document.body);
  }, []);

  const dialogRef = useRef<HTMLDivElement>(null);
  const startPos = useRef({ x: 0, y: 0 });
  const startSz = useRef({ width: 0, height: 0 });
  const startPos2 = useRef({ x: 0, y: 0 });
  const dragOffset = useRef({ x: 0, y: 0 });

  const motionWidth = useMotionValue(defaultSize.width);
  const motionHeight = useMotionValue(defaultSize.height);
  const motionX = useMotionValue(defaultPosition.x);
  const motionY = useMotionValue(defaultPosition.y);
  const springCfg = { stiffness: 300, damping: 30 };
  const springWidth = useSpring(motionWidth, springCfg);
  const springHeight = useSpring(motionHeight, springCfg);
  const springX = useSpring(motionX, springCfg);
  const springY = useSpring(motionY, springCfg);

  useEffect(() => {
    motionWidth.set(size.width);
  }, [size.width]);
  useEffect(() => {
    motionHeight.set(size.height);
  }, [size.height]);
  useEffect(() => {
    motionX.set(position.x);
  }, [position.x]);
  useEffect(() => {
    motionY.set(position.y);
  }, [position.y]);

  const clampPos = useCallback(
    (pos: { x: number; y: number }) => {
      const { w, h } = getViewport();
      return {
        x: Math.max(0, Math.min(pos.x, Math.max(50, w - size.width))),
        y: Math.max(0, Math.min(pos.y, Math.max(50, h - size.height))),
      };
    },
    [size.width, size.height],
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isResizing) {
        const dx = e.clientX - startPos.current.x;
        const dy = e.clientY - startPos.current.y;
        let nw = startSz.current.width;
        let nh = startSz.current.height;
        let nx = startPos2.current.x;
        let ny = startPos2.current.y;

        if (resizeDirection.includes("right"))
          nw = Math.max(280, startSz.current.width + dx);
        if (resizeDirection.includes("left")) {
          nw = Math.max(280, startSz.current.width - dx);
          nx = startPos2.current.x + dx;
        }
        if (resizeDirection.includes("bottom"))
          nh = Math.max(200, startSz.current.height + dy);
        if (resizeDirection.includes("top")) {
          nh = Math.max(200, startSz.current.height - dy);
          ny = startPos2.current.y + dy;
        }

        setSize({ width: nw, height: nh });
        if (
          resizeDirection.includes("left") ||
          resizeDirection.includes("top")
        ) {
          setPosition(clampPos({ x: nx, y: ny }));
        }
      } else if (isDragging) {
        setPosition(
          clampPos({
            x: e.clientX - dragOffset.current.x,
            y: e.clientY - dragOffset.current.y,
          }),
        );
      }
    },
    [isResizing, isDragging, resizeDirection, clampPos],
  );

  const handleMouseUp = useCallback(() => {
    if (isResizing) onSizeChange?.(size.width, size.height);
    if (isDragging) onPositionChange?.(position.x, position.y);
    setIsResizing(false);
    setIsDragging(false);
    setResizeDirection("");
  }, [isResizing, isDragging, size, position, onSizeChange, onPositionChange]);

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

  const handleResizeMouseDown = (e: React.MouseEvent, dir: string) => {
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(true);
    setResizeDirection(dir);
    startPos.current = { x: e.clientX, y: e.clientY };
    startSz.current = { ...size };
    startPos2.current = { ...position };
    onFocus?.();
  };

  const handleDragMouseDown = (e: React.MouseEvent) => {
    if (isResizing) return;
    e.preventDefault();
    setIsDragging(true);
    const rect = dialogRef.current?.getBoundingClientRect();
    if (rect)
      dragOffset.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    onFocus?.();
  };

  const handleReset = () => {
    setIsMaximized(false);
    const resetSize = {
      width: STICKY_NOTE_DEFAULT_WIDTH,
      height: STICKY_NOTE_DEFAULT_HEIGHT,
    };
    setSize(resetSize);
    setPosition(defaultPosition);
    onSizeChange?.(resetSize.width, resetSize.height);
    onPositionChange?.(defaultPosition.x, defaultPosition.y);
  };

  const handleMaximize = () => {
    if (isMaximized) {
      if (preMaximizeState) {
        setSize(preMaximizeState.size);
        setPosition(preMaximizeState.position);
      }
      setIsMaximized(false);
    } else {
      setPreMaximizeState({ size: { ...size }, position: { ...position } });
      const { w, h } = getViewport();
      setSize({ width: w, height: h });
      setPosition({ x: 0, y: 0 });
      setIsMaximized(true);
    }
  };

  const headerHeight = 48;
  const contentHeight = `calc(100% - ${headerHeight}px)`;
  const hasColors = !!bgColor;

  const IconBtn = ({
    onClick,
    title: t,
    children: ch,
  }: {
    onClick: () => void;
    title: string;
    children: React.ReactNode;
  }) => (
    <button
      onClick={onClick}
      onMouseDown={(e) => e.stopPropagation()}
      title={t}
      className="h-6 w-6 flex items-center justify-center rounded transition-opacity hover:opacity-60"
      style={{ color: hasColors ? textColor : undefined }}
    >
      {ch}
    </button>
  );

  if (!open || !portalTarget) return null;

  const dialog = (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={dialogRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
          className={`shadow-2xl flex flex-col ${
            isMaximized ? "" : "rounded-lg"
          } ${hasColors ? "" : "bg-background border border-border"}`}
          style={{
            position: "fixed",
            left: springX,
            top: springY,
            width: springWidth,
            height: springHeight,
            zIndex,
            pointerEvents: "auto",
            ...(hasColors && {
              backgroundColor: bgColor,
              color: textColor,
              border: isMaximized
                ? "none"
                : `1.5px solid ${headerBgColor ?? bgColor}`,
            }),
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
            onFocus?.();
          }}
        >
          {/* ── Resize handles (hidden when maximized) ── */}
          {!isMaximized && (
            <>
              {(["left", "right", "top", "bottom"] as const).map((dir) => (
                <div
                  key={dir}
                  className={`absolute z-10 rounded-full opacity-0 hover:opacity-40 transition-opacity ${
                    dir === "left"
                      ? "left-0.5  top-1/2  -translate-y-1/2 h-10 w-1.5 cursor-w-resize"
                      : dir === "right"
                        ? "right-0.5 top-1/2  -translate-y-1/2 h-10 w-1.5 cursor-e-resize"
                        : dir === "top"
                          ? "top-0.5   left-1/2 -translate-x-1/2 w-10 h-1.5 cursor-n-resize"
                          : "bottom-0.5 left-1/2 -translate-x-1/2 w-10 h-1.5 cursor-s-resize"
                  }`}
                  style={{ backgroundColor: hasColors ? textColor : "#9ca3af" }}
                  onMouseDown={(e) => handleResizeMouseDown(e, dir)}
                />
              ))}
              {(
                [
                  [
                    "top-left",
                    "left-0  top-0    cursor-nw-resize",
                    "M6 6H18M6 6V18",
                  ],
                  [
                    "top-right",
                    "right-0 top-0    cursor-ne-resize",
                    "M18 6H6M18 6V18",
                  ],
                  [
                    "bottom-left",
                    "left-0  bottom-0 cursor-sw-resize",
                    "M6 18H18M6 18V6",
                  ],
                  [
                    "bottom-right",
                    "right-0 bottom-0 cursor-se-resize",
                    "M18 18H6M18 18V6",
                  ],
                ] as [string, string, string][]
              ).map(([corner, cls, d]) => (
                <div
                  key={corner}
                  className={`absolute z-10 opacity-0 hover:opacity-40 transition-opacity ${cls}`}
                  style={{ color: hasColors ? textColor : undefined }}
                  onMouseDown={(e) => handleResizeMouseDown(e, corner)}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path
                      d={d}
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              ))}
            </>
          )}

          {/* ── Header ── */}
          <div
            className={`cursor-move active:cursor-grabbing px-3 flex items-center justify-between flex-shrink-0 border-b ${
              isMaximized ? "" : "rounded-t-lg"
            }`}
            style={{
              height: `${headerHeight}px`,
              ...(hasColors
                ? {
                    backgroundColor: headerBgColor ?? bgColor,
                    color: textColor,
                    borderBottomColor: `${textColor}25`,
                  }
                : {}),
            }}
            onMouseDown={handleDragMouseDown}
          >
            <h2
              className="flex-1 text-sm font-semibold truncate mr-2 select-none"
              style={{ color: hasColors ? textColor : undefined }}
            >
              {title}
            </h2>

            <div
              className="flex items-center gap-0.5"
              onMouseDown={(e) => e.stopPropagation()}
            >
              {headerActions}
              <div
                className="w-px h-4 mx-1 opacity-25"
                style={{ backgroundColor: hasColors ? textColor : "#6b7280" }}
              />
              <IconBtn onClick={handleReset} title="Reset size & position">
                <RotateCcw className="h-3.5 w-3.5" strokeWidth={2.5} />
              </IconBtn>
              <IconBtn
                onClick={handleMaximize}
                title={isMaximized ? "Restore" : "Maximize"}
              >
                {isMaximized ? (
                  <Minimize className="h-3.5 w-3.5" strokeWidth={2.5} />
                ) : (
                  <Maximize className="h-3.5 w-3.5" strokeWidth={2.5} />
                )}
              </IconBtn>
              <button
                onClick={() => onOpenChange(false)}
                onMouseDown={(e) => e.stopPropagation()}
                title="Close"
                className="h-6 w-6 flex items-center justify-center rounded transition-opacity hover:opacity-60"
                style={{ color: hasColors ? textColor : undefined }}
              >
                <X className="h-3.5 w-3.5" strokeWidth={2.5} />
              </button>
            </div>
          </div>

          {/* ── Content ── */}
          <div
            className="flex-1 overflow-auto px-3 pb-3 pt-2"
            style={{
              height: contentHeight,
              color: hasColors ? textColor : undefined,
            }}
          >
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return ReactDOM.createPortal(dialog, portalTarget);
};

export default StickyNotesFloatingDialog;
