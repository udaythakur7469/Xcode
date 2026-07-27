"use client";

import React from "react";
import RevealOnScroll from "../helperComponents/RevealOnScroll";
import CountUpNumber from "../helperComponents/CountUpNumber";
import { STATS_LIST } from "../landingPageData/statsData";

const StatsSection: React.FC = () => {
  return (
    <section className="border-y border-border bg-card py-[50px]">
      <div className="max-w-[1280px] mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-5 text-center">
        {STATS_LIST.map((stat, index) => (
          <RevealOnScroll key={stat.id} delay={index * 0.08}>
            <div className="font-mono text-[1.8rem] md:text-[2.6rem] font-bold text-brand">
              <CountUpNumber target={stat.value} suffix={stat.suffix} />
            </div>
            <div className="mt-1.5 text-sm text-muted-foreground">
              {stat.label}
            </div>
          </RevealOnScroll>
        ))}
      </div>
    </section>
  );
};

export default StatsSection;
