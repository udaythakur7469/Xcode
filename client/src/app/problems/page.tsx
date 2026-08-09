"use client";

import React, { Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/landingPage/navbar/Navbar";
import ProblemList from "@/components/problemsPage/problemsList/ProblemList";
import AnalyticsPanel from "@/components/problemsPage/analyticsPanel/AnalyticsPanel";
import { useCalendarStore } from "@/features/calenderStore";
import ProblemCalendar from "@/components/problemsPage/analyticsPanel/ProblemCalender";
import PotdCard from "@/components/problemsPage/analyticsPanel/PotdCard";
import RevisionQueue from "@/components/problemsPage/analyticsPanel/RevisionQueue";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

const analyticsPanelVariants = {
  hidden: { width: 0, opacity: 0, x: 24 },
  visible: {
    width: 420,
    opacity: 1,
    x: 0,
    transition: {
      width: { type: "spring", stiffness: 280, damping: 32 },
      opacity: { duration: 0.2, delay: 0.05 },
      x: { type: "spring", stiffness: 280, damping: 32 },
    },
  },
  exit: {
    width: 0,
    opacity: 0,
    x: 24,
    transition: {
      width: { type: "spring", stiffness: 280, damping: 32 },
      opacity: { duration: 0.15 },
      x: { duration: 0.2 },
    },
  },
};

const ProblemsPageContent: React.FC = () => {
  const isAnalyticsPanelOpen = useCalendarStore((s) => s.isAnalyticsPanelOpen);

  useDocumentTitle("My Problems | Xcode");

  return (
    <>
      <Navbar buttons={["Explore Xcode", "Mock Interviews", "Contests"]} />

      <div className="flex h-[calc(100vh-52px)] w-full flex-row gap-5 overflow-hidden px-[20px] mt-3 mb-5">
        <div className="flex min-w-0 flex-1 flex-row gap-0 overflow-hidden">
          <motion.div
            className="min-w-0 flex-1 overflow-y-auto"
            layout
            transition={{
              layout: { type: "spring", stiffness: 280, damping: 32 },
            }}
          >
            <ProblemList />
          </motion.div>

          <AnimatePresence>
            {isAnalyticsPanelOpen && (
              <motion.div
                key="analytics-panel"
                className="ml-4 h-full shrink-0 overflow-hidden"
                variants={analyticsPanelVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <AnalyticsPanel />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="flex w-[365px] shrink-0 flex-col gap-3 overflow-y-auto pb-5">
          <ProblemCalendar />
          <PotdCard />
          <RevisionQueue />
        </div>
      </div>
    </>
  );
};

const ProblemsPage: React.FC = () => {
  return (
    <Suspense fallback={null}>
      <ProblemsPageContent />
    </Suspense>
  );
};

export default ProblemsPage;
