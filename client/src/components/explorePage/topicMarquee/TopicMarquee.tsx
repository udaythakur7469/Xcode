"use client";

import React, { useMemo } from "react";
import RevealOnScroll from "@/components/landingPage/helperComponents/RevealOnScroll";
import { topicTags } from "@/components/landingPage/landingPageData/data";

const TopicMarquee: React.FC = () => {
  const { topRow, bottomRow } = useMemo(() => {
    const half = Math.ceil(topicTags.length / 2);
    const top = topicTags.slice(0, half);
    const bottom = topicTags.slice(half);
    // Tripled so the seam is always covered by identical content —
    // avoids any gap/empty flash at the loop boundary on wide screens.
    return {
      topRow: [...top, ...top, ...top],
      bottomRow: [...bottom, ...bottom, ...bottom],
    };
  }, []);

  return (
    <section className="py-14 border-y border-border bg-card">
      <RevealOnScroll className="overflow-hidden relative mb-3.5">
        {/* Top row scrolls right-to-left; edges are masked so tags fade in/out smoothly */}
        <div
          className="overflow-hidden relative"
          style={{
            WebkitMaskImage:
              "linear-gradient(90deg, transparent, black 8%, black 92%, transparent)",
            maskImage:
              "linear-gradient(90deg, transparent, black 8%, black 92%, transparent)",
          }}
        >
          <div className="flex gap-3.5 w-max animate-scroll-left">
            {topRow.map((tag, index) => (
              <span
                key={`${tag}-${index}`}
                className="font-mono text-[0.82rem] px-[18px] py-2.5 rounded-lg border border-border bg-background whitespace-nowrap"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </RevealOnScroll>

      <div
        className="overflow-hidden relative"
        style={{
          WebkitMaskImage:
            "linear-gradient(90deg, transparent, black 8%, black 92%, transparent)",
          maskImage:
            "linear-gradient(90deg, transparent, black 8%, black 92%, transparent)",
        }}
      >
        <div className="flex gap-3.5 w-max animate-scroll-right">
          {bottomRow.map((tag, index) => (
            <span
              key={`${tag}-${index}`}
              className="font-mono text-[0.82rem] px-[18px] py-2.5 rounded-lg border border-border bg-background whitespace-nowrap"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TopicMarquee;
