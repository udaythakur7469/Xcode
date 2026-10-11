"use client";

import React, { useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

// ─────────────────────────────────────────────────────────────────────────────
// Sliding tab panels, same motion as QuestionTabs: the old panel and the new
// panel slide together, in the direction of the tab that was clicked (a tab to
// the right slides in from the right, a tab to the left slides in from the
// left). The box also animates its height, because the tabs differ in height.
//
// Usage:
//   <TabPanels value={activeTab} order={ORDER}>
//     <TabPanel value="a" className="flex flex-col gap-4">…</TabPanel>
//     <TabPanel value="b" className="flex flex-col gap-4">…</TabPanel>
//   </TabPanels>
// ─────────────────────────────────────────────────────────────────────────────

type TabPanelProps = {
  value: string;
  className?: string;
  children?: React.ReactNode;
};

// Marker component: TabPanels reads its props and renders the active one.
export const TabPanel: React.FC<TabPanelProps> = () => null;

type TabPanelsProps = {
  value: string;
  order: readonly string[];
  children: React.ReactNode;
};

const DURATION = 0.4;

const variants = {
  enter: (direction: number) => ({ x: `${direction * 100}%` }),
  center: { x: 0 },
  exit: (direction: number) => ({ x: `${direction * -100}%` }),
};

export const TabPanels: React.FC<TabPanelsProps> = ({
  value,
  order,
  children,
}) => {
  const reduceMotion = useReducedMotion();

  // Direction of travel: +1 when the new tab is to the right of the old one
  const [previous, setPrevious] = useState(value);
  const [direction, setDirection] = useState(1);
  if (value !== previous) {
    setPrevious(value);
    setDirection(order.indexOf(value) > order.indexOf(previous) ? 1 : -1);
  }

  const active = React.Children.toArray(children).find(
    (child): child is React.ReactElement<TabPanelProps> =>
      React.isValidElement<TabPanelProps>(child) && child.props.value === value,
  );

  // Panels are absolutely positioned so the old and new one can overlap while
  // sliding; the box takes its height from whichever panel is active.
  const nodes = useRef<Record<string, HTMLDivElement | null>>({});
  const [height, setHeight] = useState<number | undefined>(undefined);
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    const node = nodes.current[value];
    if (!node) return;
    // offsetHeight gives an immediate first value; the observer then refines it
    // to the exact layout height. Layout size is used (never getBoundingClientRect)
    // because the dialog's own zoom-in animation would otherwise shrink the reading.
    setHeight(node.offsetHeight);
    const observer = new ResizeObserver((entries) => {
      const size = entries[0]?.borderBoxSize?.[0]?.blockSize;
      setHeight(size ?? node.offsetHeight);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [value]);

  // Only animate the height after the first measurement, so the dialog does
  // not grow from zero when it opens.
  useLayoutEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div
      className="relative overflow-hidden"
      style={{
        height,
        transition:
          ready && !reduceMotion
            ? `height ${DURATION}s ease-in-out`
            : undefined,
      }}
    >
      <AnimatePresence mode="sync" initial={false} custom={direction}>
        {active && (
          <motion.div
            key={value}
            ref={(node) => {
              nodes.current[value] = node;
            }}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              duration: reduceMotion ? 0 : DURATION,
              ease: "easeInOut",
            }}
            // pb-4 reproduces the space the old TabsContent left below its
            // content, so the dialog keeps exactly the same height as before
            className={`absolute inset-x-0 top-0 pb-4 ${active.props.className ?? ""}`}
          >
            {active.props.children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
