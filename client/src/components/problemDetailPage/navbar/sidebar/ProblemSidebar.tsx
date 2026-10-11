"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  type AnimationPlaybackControls,
} from "framer-motion";
import { ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LoginDialog } from "@/components/auth/loginPage/LoginDialog";
import { SignupDialog } from "@/components/auth/signupPage/SignupDialog";
import { ForgotPasswordDialog } from "@/components/auth/forgotPasswordPage/ForgotPasswordDialog";
import { useUserStore } from "@/features/userStore";
import { useProblemNavStore } from "@/features/problemNavStore";
import ProblemListToolbar from "./problemList/ProblemListToolbar";
import ProblemListBody from "./problemList/ProblemListBody";
import {
  getLayoutForWidth,
  type ProblemListLayout,
} from "./problemList/problemListLayout";

type ProblemSidebarProps = {
  onClose: () => void;
  isOpen: boolean;
};

// ── Sizing ───────────────────────────────────────────────────────────
// The default width follows the screen (42% of it, between 320 and 600px)
// and the panel can be dragged wider/narrower from its right edge. On a
// phone-sized screen it simply fills the width and the drag handle is
// hidden. The panel is unmounted on close, so every open starts again at
// the default width.
const MIN_WIDTH = 320;
const MAX_WIDTH = 900;
const MAX_VIEWPORT_RATIO = 0.9;
const DEFAULT_MAX_WIDTH = 600;
const DEFAULT_VIEWPORT_RATIO = 0.42;
const MOBILE_BREAKPOINT = 700;
const KEYBOARD_RESIZE_STEP = 24;
// Dragging past the limits stretches with resistance, then springs back.
const OVERSHOOT_LIMIT = 60;
const OVERSHOOT_RESISTANCE = 0.3;

const PANEL_SPRING = { type: "spring", stiffness: 420, damping: 40 } as const;

const isMobileViewport = () => window.innerWidth <= MOBILE_BREAKPOINT;

const getDefaultWidth = () =>
  isMobileViewport()
    ? window.innerWidth
    : Math.round(
        Math.min(
          DEFAULT_MAX_WIDTH,
          Math.max(MIN_WIDTH, window.innerWidth * DEFAULT_VIEWPORT_RATIO),
        ),
      );

const getMaxWidth = () =>
  isMobileViewport()
    ? window.innerWidth
    : Math.min(MAX_WIDTH, window.innerWidth * MAX_VIEWPORT_RATIO);

const clampWidth = (width: number) =>
  Math.round(Math.min(getMaxWidth(), Math.max(MIN_WIDTH, width)));

const withResistance = (raw: number) => {
  const max = getMaxWidth();
  if (raw < MIN_WIDTH) {
    return (
      MIN_WIDTH -
      Math.min(OVERSHOOT_LIMIT, (MIN_WIDTH - raw) * OVERSHOOT_RESISTANCE)
    );
  }
  if (raw > max) {
    return max + Math.min(OVERSHOOT_LIMIT, (raw - max) * OVERSHOOT_RESISTANCE);
  }
  return raw;
};

interface ProblemListPanelProps {
  onClose: () => void;
  onRequestLogin: () => void;
  isAuthDialogOpen: boolean;
}

const ProblemListPanel: React.FC<ProblemListPanelProps> = ({
  onClose,
  onRequestLogin,
  isAuthDialogOpen,
}) => {
  const router = useRouter();
  const isAuthenticated = useUserStore((s) => s.isUserAuthenticated);
  const summary = useProblemNavStore((s) => s.summary);

  const panelRef = useRef<HTMLElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);

  const width = useMotionValue(getDefaultWidth());
  const widthAnimationRef = useRef<AnimationPlaybackControls | null>(null);
  const hasManualWidthRef = useRef(false);

  const [layout, setLayout] = useState<ProblemListLayout>(() =>
    getLayoutForWidth(width.get()),
  );
  const [isMobile, setIsMobile] = useState(() => isMobileViewport());
  const [isDragging, setIsDragging] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Rows re-flow as the panel is resized. Only re-render when the layout
  // actually changes (three states), not on every pixel of a drag.
  useMotionValueEvent(width, "change", (latest) => {
    const next = getLayoutForWidth(latest);
    setLayout((previous) => (previous === next ? previous : next));
    handleRef.current?.setAttribute("aria-valuenow", String(Math.round(latest)));
  });

  const animateWidthTo = useCallback(
    (target: number) => {
      widthAnimationRef.current?.stop();
      widthAnimationRef.current = animate(width, target, PANEL_SPRING);
    },
    [width],
  );

  // Keep the width sensible when the window itself is resized.
  useEffect(() => {
    const onResize = () => {
      setIsMobile(isMobileViewport());
      widthAnimationRef.current?.stop();
      if (isMobileViewport() || !hasManualWidthRef.current) {
        width.set(getDefaultWidth());
      } else {
        width.set(clampWidth(width.get()));
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [width]);

  // Focus: into the search box on open (not on touch devices, where it
  // would pop the keyboard), and back to wherever it was on close.
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    if (!window.matchMedia("(pointer: coarse)").matches) {
      searchInputRef.current?.focus({ preventScroll: true });
    }
    return () => previouslyFocused?.focus?.({ preventScroll: true });
  }, []);

  // Esc closes the filters first, then the panel. "/" jumps to search.
  // Tab is kept inside the panel while it is open.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // A login/signup dialog on top owns the keyboard.
      if (isAuthDialogOpen) return;

      if (e.key === "Escape") {
        if (e.defaultPrevented) return; // e.g. the search box just cleared itself
        e.preventDefault();
        if (filtersOpen) setFiltersOpen(false);
        else onClose();
        return;
      }

      if (e.key === "/" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const target = e.target as HTMLElement | null;
        const isTyping =
          !!target &&
          (target.tagName === "INPUT" ||
            target.tagName === "TEXTAREA" ||
            target.isContentEditable);
        if (!isTyping) {
          e.preventDefault();
          searchInputRef.current?.focus();
        }
        return;
      }

      if (e.key === "Tab") {
        const root = panelRef.current;
        if (!root) return;
        const focusable = Array.from(
          root.querySelectorAll<HTMLElement>(
            'button:not([disabled]), input:not([disabled]), [tabindex="0"]',
          ),
        ).filter(
          (el) => el.offsetParent !== null || el === document.activeElement,
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const active = document.activeElement;
        if (!root.contains(active)) {
          e.preventDefault();
          first.focus();
        } else if (e.shiftKey && active === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [filtersOpen, isAuthDialogOpen, onClose]);

  // ── Resize handle ─────────────────────────────────────────────────
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    widthAnimationRef.current?.stop();
    hasManualWidthRef.current = true;
    setIsDragging(true);
    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    // The panel is anchored to the left edge, so the pointer's x IS the width.
    width.set(withResistance(e.clientX));
  };

  const endDrag = () => {
    setIsDragging(false);
    document.body.style.userSelect = "";
    document.body.style.cursor = "";
    const current = width.get();
    const clamped = clampWidth(current);
    // Released while stretched past a limit: spring back to it.
    if (Math.abs(current - clamped) > 0.5) animateWidthTo(clamped);
  };

  // Never leave the page stuck in "resizing" if we unmount mid-drag.
  useEffect(
    () => () => {
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    },
    [],
  );

  const handleResizeKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    hasManualWidthRef.current = true;
    const delta = e.key === "ArrowRight" ? KEYBOARD_RESIZE_STEP : -KEYBOARD_RESIZE_STEP;
    width.set(clampWidth(width.get() + delta));
  };

  const handleResetWidth = () => {
    hasManualWidthRef.current = false;
    animateWidthTo(getDefaultWidth());
  };

  const solvedPercent =
    isAuthenticated && summary && summary.total > 0
      ? (summary.solved / summary.total) * 100
      : 0;

  return (
    <motion.aside
      ref={panelRef}
      data-problem-panel=""
      role="dialog"
      aria-modal="true"
      aria-label="Problem list"
      initial={{ x: "-100%" }}
      animate={{ x: 0 }}
      exit={{ x: "-100%" }}
      transition={PANEL_SPRING}
      style={{ width, maxWidth: "100vw" }}
      className="fixed left-0 top-0 z-50 flex h-full flex-col border-r bg-background shadow-lg"
    >
      {/* Header */}
      <div className="flex flex-none items-center gap-3 border-b px-3.5 py-3">
        <button
          type="button"
          onClick={() => router.push("/problems")}
          title="Open the full problem list"
          className="group flex items-center gap-1 rounded-md text-lg font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Problems
          <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
        </button>

        <div className="ml-auto min-w-0 truncate text-sm text-muted-foreground">
          {isAuthenticated ? (
            summary && (
              <>
                <span className="font-semibold text-foreground">
                  {summary.solved}
                </span>{" "}
                / {summary.total} solved
              </>
            )
          ) : (
            <button
              type="button"
              onClick={onRequestLogin}
              className="text-brand outline-none hover:underline focus-visible:underline"
            >
              Log in to track progress
            </button>
          )}
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 flex-none"
          aria-label="Close problem list"
          onClick={onClose}
        >
          <X />
        </Button>
      </div>

      {/* Progress track: always rendered so logging in doesn't shift anything */}
      <div className="h-[3px] flex-none bg-border">
        <motion.div
          className="h-full bg-brand"
          initial={false}
          animate={{ width: `${solvedPercent}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>

      <ProblemListToolbar
        layout={layout}
        filtersOpen={filtersOpen}
        onFiltersOpenChange={setFiltersOpen}
        searchInputRef={searchInputRef}
        onRequestLogin={onRequestLogin}
        isAuthDialogOpen={isAuthDialogOpen}
      />

      <ProblemListBody layout={layout} onClose={onClose} />

      {/* Resize handle on the right edge */}
      {!isMobile && (
        <div
          ref={handleRef}
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize problem list. Double-click to reset."
          aria-valuemin={MIN_WIDTH}
          aria-valuemax={MAX_WIDTH}
          aria-valuenow={Math.round(width.get())}
          tabIndex={0}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onDoubleClick={handleResetWidth}
          onKeyDown={handleResizeKeyDown}
          className="group absolute -right-[5px] top-0 z-10 h-full w-[10px] cursor-col-resize touch-none outline-none"
        >
          <span
            className={cn(
              "absolute inset-y-0 left-1 w-[2px] bg-transparent transition-colors group-hover:bg-brand group-focus-visible:bg-brand",
              isDragging && "bg-brand",
            )}
          />
        </div>
      )}
    </motion.aside>
  );
};

const ProblemSidebar: React.FC<ProblemSidebarProps> = ({ onClose, isOpen }) => {
  const checkAuth = useUserStore((s) => s.checkAuth);

  // The login flow is hosted here (not in the navbar) so the locked Status
  // filter and "Log in to track progress" can open it right from the panel.
  // It mirrors the navbar's own Login / Signup / Forgot password wiring.
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSignupOpen, setIsSignupOpen] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const isAuthDialogOpen = isLoginOpen || isSignupOpen || isForgotPasswordOpen;

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="problem-list-backdrop"
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="fixed inset-0 z-40 bg-black"
            onClick={onClose}
          />
        )}
        {isOpen && (
          <ProblemListPanel
            key="problem-list-panel"
            onClose={onClose}
            onRequestLogin={() => setIsLoginOpen(true)}
            isAuthDialogOpen={isAuthDialogOpen}
          />
        )}
      </AnimatePresence>

      <LoginDialog
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        openSignup={() => {
          setIsLoginOpen(false);
          setIsSignupOpen(true);
        }}
        openForgotPassword={() => {
          setIsLoginOpen(false);
          setIsForgotPasswordOpen(true);
        }}
        onSuccessfulAuth={checkAuth}
      />
      <SignupDialog
        isOpen={isSignupOpen}
        onClose={() => setIsSignupOpen(false)}
        openLogin={() => {
          setIsSignupOpen(false);
          setIsLoginOpen(true);
        }}
        onSuccessfulAuth={checkAuth}
      />
      <ForgotPasswordDialog
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
        openLogin={() => {
          setIsForgotPasswordOpen(false);
          setIsLoginOpen(true);
        }}
      />
    </>
  );
};

export default ProblemSidebar;
