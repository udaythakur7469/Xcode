"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Lock } from "lucide-react";
import { useProblemStore } from "@/features/problemStore";
import { HintsDialogSkeleton } from "./HintsDialogSkeleton";

type HintsDialogProps = {
  problemTitle: string;
  problemDescription: string;
  userCode: string;
  language: string;
};

const HintsDialog: React.FC<HintsDialogProps> = ({
  problemTitle,
  problemDescription,
  userCode,
  language,
}) => {
  const {
    hints,
    unlockedLevel,
    isLoadingHints,
    hintsError,
    fetchAiHints,
    updateUnlockLevel,
  } = useProblemStore();

  const [openItems, setOpenItems] = useState<string[]>([]);
  const prevLanguageRef = useRef<string>(language);

  useEffect(() => {
    fetchAiHints({ problemTitle, problemDescription, userCode, language });
    prevLanguageRef.current = language;
  }, []);

  useEffect(() => {
    if (language !== prevLanguageRef.current) {
      prevLanguageRef.current = language;
      setOpenItems([]);
      fetchAiHints({ problemTitle, problemDescription, userCode, language });
    }
  }, [language]);

  const handleAccordionChange = (newOpenItems: string[]) => {
    setOpenItems(newOpenItems);

    const openedLevels = newOpenItems
      .map((val) => parseInt(val.replace("hint-", ""), 10))
      .filter(Boolean);

    if (openedLevels.length === 0) return;

    const maxOpened = Math.max(...openedLevels);
    const newUnlocked = Math.min(maxOpened + 1, 3);
    if (newUnlocked > unlockedLevel) {
      updateUnlockLevel({ problemTitle, language, unlockedLevel: newUnlocked });
    }
  };

  // ── Loading state — render only the spinner, no header ─────────────────────
  if (isLoadingHints) {
    return (
      <DialogContent className="flex flex-col items-center justify-center min-h-[350px]">
        <HintsDialogSkeleton />
      </DialogContent>
    );
  }

  // ── Error state ─────────────────────────────────────────────────────────────
  if (hintsError) {
    return (
      <DialogContent className="flex flex-col justify-center">
        <DialogHeader>
          <DialogTitle className="flex justify-center m-0 p-0">
            <span className="text-4xl flex justify-center">Hints</span>
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center py-8 gap-2">
          <p className="text-sm text-muted-foreground text-center">
            Hints are temporarily unavailable.
          </p>
          <p className="text-xs text-muted-foreground text-center">
            Please try again in a moment.
          </p>
        </div>
      </DialogContent>
    );
  }

  // ── Loaded state ────────────────────────────────────────────────────────────
  return (
    <DialogContent className="flex flex-col justify-center">
      <DialogHeader>
        <DialogTitle className="flex justify-center m-0 p-0">
          <span className="text-4xl flex justify-center">Hints</span>
        </DialogTitle>
        <DialogDescription className="flex flex-col justify-center">
          <span className="flex justify-center items-center m-3 mb-0 text-md">
            Below are the hints for this problem
          </span>
          <span className="flex justify-center items-center m-3 text-md">
            We advise you to think about the problem before checking the hints
          </span>
        </DialogDescription>
      </DialogHeader>

      {hints.length === 0 ? (
        <div className="text-muted-foreground text-md text-center py-6">
          No hints available for this problem.
        </div>
      ) : (
        <Accordion
          type="multiple"
          value={openItems}
          onValueChange={handleAccordionChange}
          className="w-full"
        >
          {hints.map((hint, index) => {
            const level = index + 1;
            const isLocked = level > unlockedLevel;
            const itemValue = `hint-${level}`;

            return (
              <AccordionItem key={index} value={itemValue}>
                {isLocked ? (
                  <div
                    className="relative flex items-center justify-center w-full rounded-md border border-input bg-background px-4 py-4 mt-2 mb-2 cursor-not-allowed select-none opacity-50"
                    aria-disabled="true"
                    role="button"
                    tabIndex={-1}
                  >
                    <span className="text-sm font-medium text-muted-foreground">
                      Hint {level}
                    </span>
                    <Lock
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                      size={15}
                      aria-label="Locked"
                    />
                  </div>
                ) : (
                  <>
                    <AccordionTrigger className="w-full text-xl mt-2 mb-2">
                      Hint {level}
                    </AccordionTrigger>
                    <AccordionContent>{hint}</AccordionContent>
                  </>
                )}
              </AccordionItem>
            );
          })}
        </Accordion>
      )}
    </DialogContent>
  );
};

export default HintsDialog;
