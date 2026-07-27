"use client";

import React from "react";
import RevealOnScroll from "../helperComponents/RevealOnScroll";
import { SUPPORTED_LANGUAGES } from "../landingPageData/languagesData";

const LanguageMarquee: React.FC = () => {
  // Doubled list so the CSS marquee loop is seamless (translateX(-50%)).
  const loopedLanguages = [...SUPPORTED_LANGUAGES, ...SUPPORTED_LANGUAGES];

  return (
    <section className="pt-[90px] pb-[60px]">
      <div className="max-w-[1280px] mx-auto px-6">
        <RevealOnScroll className="text-center max-w-[640px] mx-auto mb-14">
          <span className="block font-mono text-xs uppercase tracking-wide text-brand mb-3.5">
            Polyglot judging
          </span>
          <h2 className="text-[1.7rem] md:text-[2.4rem] font-extrabold tracking-tight">
            Solve in whichever language you think in
          </h2>
        </RevealOnScroll>
      </div>

      <div
        className="overflow-hidden relative"
        style={{
          WebkitMaskImage:
            "linear-gradient(90deg, transparent, black 10%, black 90%, transparent)",
          maskImage:
            "linear-gradient(90deg, transparent, black 10%, black 90%, transparent)",
        }}
      >
        <div className="flex gap-4 w-max animate-marquee">
          {loopedLanguages.map((lang, index) => (
            <div
              key={`${lang.name}-${index}`}
              className="flex items-center gap-2.5 px-6 py-3.5 rounded-[10px] border border-border bg-card font-mono text-[0.95rem] font-semibold whitespace-nowrap"
            >
              <span
                className="w-2.5 h-2.5 rounded-[3px]"
                style={{ background: lang.color }}
              />
              {lang.name}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LanguageMarquee;
