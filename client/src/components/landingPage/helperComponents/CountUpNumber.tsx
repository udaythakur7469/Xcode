"use client";

import React, { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";

type CountUpNumberProps = {
  target: number;
  suffix?: string;
  durationMs?: number;
  className?: string;
};

const CountUpNumber: React.FC<CountUpNumberProps> = ({
  target,
  suffix = "",
  durationMs = 1600,
  className,
}) => {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!isInView) return;

    let rafId: number;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - start) / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.floor(eased * target));
      if (progress < 1) {
        rafId = requestAnimationFrame(tick);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isInView, target, durationMs]);

  return (
    <span ref={ref} className={className}>
      {value.toLocaleString()}
      {suffix}
    </span>
  );
};

export default CountUpNumber;
