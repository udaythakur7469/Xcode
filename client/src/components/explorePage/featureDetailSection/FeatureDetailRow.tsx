"use client";

import React from "react";
import { useRouter } from "next/navigation";
import RevealOnScroll from "@/components/landingPage/helperComponents/RevealOnScroll";
import { Button } from "@/components/ui/button";
import { FeatureDetail } from "../explorePageData/featureDetailsData";

type FeatureDetailRowProps = {
  feature: FeatureDetail;
  reverse?: boolean;
  visual: React.ReactNode;
};

const FeatureDetailRow: React.FC<FeatureDetailRowProps> = ({
  feature,
  reverse = false,
  visual,
}) => {
  const router = useRouter();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
      <RevealOnScroll className={reverse ? "md:order-2" : undefined}>
        <span className="inline-flex items-center gap-2 font-mono text-xs text-brand bg-brand-muted border rounded-full px-3 py-1.5 mb-4" style={{ borderColor: "var(--brand-glow)" }}>
          {feature.tag}
        </span>
        <h3 className="text-2xl md:text-[1.6rem] font-extrabold mb-3.5 tracking-tight">
          {feature.title}
        </h3>
        <p className="text-muted-foreground mb-5 leading-relaxed">
          {feature.description}
        </p>
        <ul className="flex flex-col gap-2.5">
          {feature.bullets.map((point) => (
            <li key={point} className="flex gap-2.5 items-start text-[0.94rem]">
              <span className="text-brand font-bold mt-0.5">✓</span>
              {point}
            </li>
          ))}
        </ul>
        {feature.ctaLabel && feature.ctaRoute && (
          <div className="mt-6">
            <Button
              variant="outline"
              onClick={() => router.push(feature.ctaRoute!)}
            >
              {feature.ctaLabel}
            </Button>
          </div>
        )}
      </RevealOnScroll>

      <RevealOnScroll delay={0.1} className={reverse ? "md:order-1" : undefined}>
        {visual}
      </RevealOnScroll>
    </div>
  );
};

export default FeatureDetailRow;
