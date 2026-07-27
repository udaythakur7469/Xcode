"use client";

import React from "react";
import { motion } from "framer-motion";
import RevealOnScroll from "@/components/landingPage/helperComponents/RevealOnScroll";
import CountUpNumber from "@/components/landingPage/helperComponents/CountUpNumber";

const EXPLORE_STATS = [
  { id: "problems", label: "Curated problems", value: 500, suffix: "+" },
  { id: "languages", label: "Languages judged", value: 4, suffix: "" },
  { id: "users", label: "Active learners", value: 12000, suffix: "+" },
  { id: "interviews", label: "AI interviews run", value: 4200, suffix: "+" },
];

const ExploreHero: React.FC = () => {
  return (
    <section className="relative py-20 text-center">
      <div className="relative z-10 max-w-[1280px] mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border font-mono text-[0.8rem] mb-6"
          style={{
            borderColor: "var(--brand-glow)",
            background: "var(--brand-muted)",
            color: "var(--brand)",
          }}
        >
          <span className="w-[7px] h-[7px] rounded-full bg-brand animate-pulse-dot" />
          Everything xCode can do, in one place
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.05 }}
          className="text-[2.1rem] md:text-[3.4rem] font-extrabold leading-[1.15] tracking-tight mb-5 max-w-[820px] mx-auto"
        >
          Explore every tool built to get you{" "}
          <span className="text-brand">interview-ready.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-[1.1rem] text-muted-foreground max-w-[640px] mx-auto leading-relaxed mb-12"
        >
          From a real judged code editor to AI mock interviews, spaced revision,
          and community discussion — here&apos;s exactly how each part of xCode
          works, and how it fits together.
        </motion.p>

        <RevealOnScroll className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {EXPLORE_STATS.map((stat) => (
            <div key={stat.id}>
              <div className="font-mono text-[1.6rem] md:text-[2.2rem] font-bold text-brand">
                <CountUpNumber target={stat.value} suffix={stat.suffix} />
              </div>
              <div className="mt-1.5 text-sm text-muted-foreground">
                {stat.label}
              </div>
            </div>
          ))}
        </RevealOnScroll>
      </div>
    </section>
  );
};

export default ExploreHero;
