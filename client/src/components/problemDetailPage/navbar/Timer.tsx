"use client";

import React, {
  useEffect,
  useState,
  useImperativeHandle,
  forwardRef,
} from "react";
import { AlarmClock, RefreshCcw, Play, Pause, ChevronLeft } from "lucide-react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { motion, AnimatePresence } from "framer-motion";

type TimerProps = {};

export interface TimerRef {
  toggleTimer: () => void;
}

const Timer = forwardRef<TimerRef, TimerProps>((props, ref) => {
  const [showTimer, setShowTimer] = useState<boolean>(false);
  const [time, setTime] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isHidden, setIsHidden] = useState<boolean>(false);

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    toggleTimer: () => {
      if (!showTimer || isHidden) {
        handleShowTimer();
      } else {
        handleHideTimer();
      }
    },
  }));

  const formatTime = (time: number): string => {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = time % 60;

    return `${hours < 10 ? "0" + hours : hours}:${
      minutes < 10 ? "0" + minutes : minutes
    }:${seconds < 10 ? "0" + seconds : seconds}`;
  };

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (isRunning) {
      intervalId = setInterval(() => {
        setTime((time) => time + 1);
      }, 1000);
    }

    return () => clearInterval(intervalId);
  }, [isRunning]);

  useEffect(() => {
    const keyboardShortcut = (e: KeyboardEvent) => {
      const isAlt = e.altKey;
      const isShift = e.shiftKey;
      const isW = e.key === "w" || e.key === "W";
      const isBackspace = e.key === "Backspace";
      const isSpace = e.key === " ";

      // Alt + Shift + W to close timer
      if (isAlt && isShift && isW && showTimer && !isHidden) {
        e.preventDefault();
        handleHideTimer();
      }

      // Shift + Backspace to reset timer
      if (isShift && isBackspace && showTimer && !isHidden) {
        e.preventDefault();
        handleReset();
      }

      // Shift + Spacebar to pause/play timer
      if (isShift && isSpace && showTimer && !isHidden) {
        e.preventDefault();
        handlePlayPause();
      }
    };

    window.addEventListener("keydown", keyboardShortcut);

    return () => {
      window.removeEventListener("keydown", keyboardShortcut);
    };
  }, [showTimer, isHidden, isRunning]);

  const handleReset = () => {
    setTime(0);
    setIsRunning(false);
  };

  const handlePlayPause = () => {
    setIsRunning((prev) => !prev);
  };

  const handleHideTimer = () => {
    setIsHidden(true);
  };

  const handleShowTimer = () => {
    setShowTimer(true);
    setIsHidden(false);
    setIsRunning(true);
  };

  return (
    <div className="flex items-center">
      <AnimatePresence mode="wait">
        {showTimer && !isHidden ? (
          <motion.div
            key="expanded-timer"
            initial={{ scaleX: 0, opacity: 0, originX: 0 }}
            animate={{ scaleX: 1, opacity: 1, originX: 0 }}
            exit={{ scaleX: 0, opacity: 0, originX: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="flex items-center space-x-2 bg-dark-fill-3 p-1.5 cursor-pointer rounded hover:bg-dark-fill-2"
          >
            {/* Hide Timer Button */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.2 }}
              onClick={handleHideTimer}
              className="hover:bg-dark-fill-2 rounded"
            >
              <HoverCard>
                <HoverCardTrigger>
                  <ChevronLeft className="h-4 w-4" />
                </HoverCardTrigger>
                <HoverCardContent className="mr-5 p-1">
                  Hide Timer
                </HoverCardContent>
              </HoverCard>
            </motion.div>

            {/* Play/Pause Button */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.2 }}
              onClick={handlePlayPause}
              className="hover:bg-dark-fill-2 rounded"
            >
              {isRunning ? (
                <HoverCard>
                  <HoverCardTrigger>
                    <Pause className="h-4 w-4" />
                  </HoverCardTrigger>
                  <HoverCardContent className="mr-5 p-1">
                    Pause Timer
                  </HoverCardContent>
                </HoverCard>
              ) : (
                <HoverCard>
                  <HoverCardTrigger>
                    <Play className="h-4 w-4" />
                  </HoverCardTrigger>
                  <HoverCardContent className="mr-5 p-1">
                    Start Timer
                  </HoverCardContent>
                </HoverCard>
              )}
            </motion.div>

            {/* Timer Display */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.2 }}
              className="flex-1 text-center min-w-[70px]"
            >
              {formatTime(time)}
            </motion.div>

            {/* Reset Button */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25, duration: 0.2 }}
              onClick={handleReset}
              className="hover:bg-dark-fill-2 rounded"
            >
              <HoverCard>
                <HoverCardTrigger>
                  <RefreshCcw className="h-4 w-4" />
                </HoverCardTrigger>
                <HoverCardContent className="mr-5 p-1">
                  Reset Timer
                </HoverCardContent>
              </HoverCard>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="collapsed-timer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center h-8 hover:bg-dark-fill-3 rounded cursor-pointer p-2"
            onClick={handleShowTimer}
          >
            <HoverCard>
              <HoverCardTrigger>
                <AlarmClock className="h-5 w-5" />
              </HoverCardTrigger>
              <HoverCardContent className="mr-5 p-1">
                Start Timer
              </HoverCardContent>
            </HoverCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

Timer.displayName = "Timer";

export default Timer;
