import React from "react";

/**
 * Same visual intensity as the glow blob used on LandingPage.tsx /
 * ExploreHero.tsx (var(--brand-glow) radial gradient), just without the
 * .dot-grid-bg pattern layered on top.
 */
const InterviewAmbientBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        className="absolute -top-32 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(ellipse, var(--brand-glow) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute -bottom-40 right-[-120px] w-[500px] h-[500px] rounded-full blur-3xl opacity-70"
        style={{
          background:
            "radial-gradient(circle, var(--brand-glow) 0%, transparent 70%)",
        }}
      />
    </div>
  );
};

export default InterviewAmbientBackground;
