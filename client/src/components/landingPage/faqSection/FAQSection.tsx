"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import RevealOnScroll from "../helperComponents/RevealOnScroll";
import { FAQ_ITEMS } from "../landingPageData/faqData";

const FAQSection: React.FC = () => {
  const [openId, setOpenId] = useState<string | null>(null);

  const toggle = (id: string) => {
    setOpenId((current) => (current === id ? null : id));
  };

  return (
    <section className="py-[90px]">
      <div className="max-w-[1280px] mx-auto px-6">
        <RevealOnScroll className="text-center max-w-[640px] mx-auto mb-14">
          <span className="block font-mono text-xs uppercase tracking-wide text-brand mb-3.5">
            Questions
          </span>
          <h2 className="text-[1.7rem] md:text-[2.4rem] font-extrabold tracking-tight">
            Frequently asked questions
          </h2>
        </RevealOnScroll>

        <div className="max-w-[760px] mx-auto flex flex-col gap-3">
          {FAQ_ITEMS.map((item, index) => {
            const isOpen = openId === item.id;
            return (
              <RevealOnScroll key={item.id} delay={index * 0.05}>
                <div className="border border-border rounded-lg bg-card overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggle(item.id)}
                    className="w-full flex items-center justify-between px-[22px] py-[18px] text-left font-semibold text-[0.96rem]"
                    aria-expanded={isOpen}
                  >
                    <span>{item.question}</span>
                    <ChevronDown
                      className={`ml-4 shrink-0 text-brand transition-transform duration-300 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                      size={18}
                    />
                  </button>
                  <div
                    className="overflow-hidden transition-[max-height] duration-300 ease-in-out"
                    style={{ maxHeight: isOpen ? "240px" : "0px" }}
                  >
                    <div className="px-[22px] pb-5 text-sm text-muted-foreground leading-relaxed">
                      {item.answer}
                    </div>
                  </div>
                </div>
              </RevealOnScroll>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
