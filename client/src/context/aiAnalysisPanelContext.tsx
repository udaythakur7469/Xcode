"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type AiAnalysisPanelContextType = {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
};

const AiAnalysisPanelContext = createContext<AiAnalysisPanelContextType | null>(
  null,
);

export function AiAnalysisPanelProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <AiAnalysisPanelContext.Provider value={{ isOpen, setIsOpen }}>
      {children}
    </AiAnalysisPanelContext.Provider>
  );
}

export function useAiAnalysisPanel() {
  const context = useContext(AiAnalysisPanelContext);

  if (!context) {
    throw new Error(
      "useAiAnalysisPanel must be used inside AiAnalysisPanelProvider",
    );
  }

  return context;
}
