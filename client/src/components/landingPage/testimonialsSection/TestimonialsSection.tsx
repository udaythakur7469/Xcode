"use client";

import React from "react";
import RevealOnScroll from "../helperComponents/RevealOnScroll";
import { TESTIMONIALS } from "../landingPageData/testimonialsData";

const TestimonialsSection: React.FC = () => {
  // Doubled list so translateX(-50%) loops seamlessly, same technique as
  // the language marquee — never "snaps back" awkwardly.
  const loopedTestimonials = [...TESTIMONIALS, ...TESTIMONIALS];

  return (
    <section className="py-[90px]">
      <div className="max-w-[1280px] mx-auto px-6">
        <RevealOnScroll className="text-center max-w-[640px] mx-auto mb-14">
          <span className="block font-mono text-xs uppercase tracking-wide text-brand mb-3.5">
            Wall of love
          </span>
          <h2 className="text-[1.7rem] md:text-[2.4rem] font-extrabold tracking-tight mb-3.5">
            What learners are saying
          </h2>
          <p className="text-muted-foreground">
            <span className="inline-block font-mono text-[0.65rem] bg-brand-muted text-brand px-2 py-[3px] rounded-[5px] mb-2 tracking-wide">
              ⚠ SAMPLE — NOT REAL FEEDBACK
            </span>
            <br />
            Every quote below is a placeholder. Replace with real
            testimonials once you start collecting them.
          </p>
        </RevealOnScroll>
      </div>

      <div
        className="overflow-hidden relative"
        style={{
          WebkitMaskImage:
            "linear-gradient(90deg, transparent, black 6%, black 94%, transparent)",
          maskImage:
            "linear-gradient(90deg, transparent, black 6%, black 94%, transparent)",
        }}
      >
        <div className="flex gap-5 w-max animate-marquee-slow animate-marquee-paused-hover">
          {loopedTestimonials.map((testimonial, index) => (
            <div
              key={`${testimonial.name}-${index}`}
              className="min-w-[300px] max-w-[300px] border border-border rounded-lg bg-card p-6"
            >
              <span className="inline-block font-mono text-[0.65rem] bg-brand-muted text-brand px-2 py-[3px] rounded-[5px] mb-3.5 tracking-wide">
                ⚠ SAMPLE — FAKE
              </span>
              <p className="text-[0.92rem] leading-relaxed mb-[18px]">
                &quot;{testimonial.quote}&quot;
              </p>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-brand text-brand-foreground flex items-center justify-center font-bold text-sm">
                  {testimonial.name.charAt(0)}
                </div>
                <div>
                  <div className="text-sm font-semibold">
                    {testimonial.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {testimonial.role}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
