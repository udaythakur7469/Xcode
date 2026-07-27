"use client";

import React from "react";
import { motion } from "framer-motion";
import RevealOnScroll from "../helperComponents/RevealOnScroll";
import { HOMEPAGE_FEATURES } from "../landingPageData/featuresData";

const FeaturesSection: React.FC = () => {
  return (
    <section id="featured" className="py-[90px]">
      <div className="max-w-[1280px] mx-auto px-6">
        <RevealOnScroll className="text-center max-w-[640px] mx-auto mb-14">
          <span className="block font-mono text-xs uppercase tracking-wide text-brand mb-3.5">
            Why xCode
          </span>
          <h2 className="text-[1.7rem] md:text-[2.4rem] font-extrabold tracking-tight mb-3.5">
            Everything you need to actually get interview-ready
          </h2>
          <p className="text-muted-foreground">
            Not just a problem list — a full loop from practicing to
            retaining to performing under pressure.
          </p>
        </RevealOnScroll>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[22px]">
          {HOMEPAGE_FEATURES.map((feature, index) => (
            <RevealOnScroll key={feature.id} delay={index * 0.06}>
              <motion.div
                whileHover={{ y: -5 }}
                transition={{ duration: 0.25 }}
                className="h-full p-[30px] rounded-lg border bg-card hover:shadow-lg transition-colors"
                style={{ borderColor: "var(--border)" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--brand-glow)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border)";
                }}
              >
                <div className="w-[46px] h-[46px] rounded-[10px] flex items-center justify-center text-[1.3rem] mb-[18px] bg-brand-muted text-brand">
                  {feature.icon}
                </div>
                <h3 className="text-[1.08rem] font-bold mb-2.5">
                  {feature.title}
                </h3>
                <p className="text-[0.92rem] text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
