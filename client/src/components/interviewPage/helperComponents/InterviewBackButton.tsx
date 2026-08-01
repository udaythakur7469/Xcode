"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

const InterviewBackButton: React.FC = () => {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.back()}
      className="inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium text-foreground bg-secondary transition-all hover:-translate-x-0.5"
      style={{ borderColor: "var(--border)" }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--brand-dim)";
        e.currentTarget.style.background = "var(--brand-muted)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border)";
        e.currentTarget.style.background = "";
      }}
    >
      <ArrowLeft className="size-4" />
      Back
    </button>
  );
};

export default InterviewBackButton;
