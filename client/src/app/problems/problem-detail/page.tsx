"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import ResizablePanels from "@/components/problemDetailPage/resizablePanels/ResizablePanels";
import ProblemNavbar from "@/components/problemDetailPage/navbar/ProblemNavbar";
import ProblemSidebar from "@/components/problemDetailPage/navbar/sidebar/ProblemSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useProblemContext } from "@/hooks/useProblemContext";
import {
  clearPersistedProblemResults,
  getLastActiveProblemTitle,
  setLastActiveProblemTitle,
} from "@/features/submissionStore";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import dynamic from "next/dynamic";

const ProblemDetailsPageContent: React.FC = () => {
  useProblemContext();

  // Run/submit results are persisted in sessionStorage per problem so they
  // survive a reload. But if the user navigates to a DIFFERENT problem —
  // whether via the in-page ProblemSidebar (same route, no remount) or via
  // the standalone /problems list page (a real route change that remounts
  // this whole page) — the previous problem's persisted results should be
  // cleared rather than lingering around unused.
  //
  // A React ref can't track "the previous problem" reliably here: it only
  // survives within one mounted instance of this component, and a route
  // change via /problems remounts it fresh, silently skipping the cleanup.
  // getLastActiveProblemTitle/setLastActiveProblemTitle read/write
  // sessionStorage directly, which survives that remount (it's only ever
  // cleared when the browser tab itself closes), so this works no matter
  // how the user got here.
  const searchParams = useSearchParams();
  const problemTitle = searchParams.get("title");

  useDocumentTitle(problemTitle ? `${problemTitle} | Xcode` : null);

  useEffect(() => {
    if (!problemTitle) return;
    const lastActiveTitle = getLastActiveProblemTitle();
    if (lastActiveTitle && lastActiveTitle !== problemTitle) {
      clearPersistedProblemResults(lastActiveTitle);
    }
    setLastActiveProblemTitle(problemTitle);
  }, [problemTitle]);

  const [resetLayoutTrigger, setResetLayoutTrigger] = useState(0);

  // Add triggers for code actions
  const [runCodeTrigger, setRunCodeTrigger] = useState(0);
  const [submitCodeTrigger, setSubmitCodeTrigger] = useState(0);

  const [code, setCode] = useState<string>("");
  const [language, setLanguage] = useState<string>("cpp");

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleResetLayout = () => {
    setResetLayoutTrigger((prev) => prev + 1);
  };

  // Add handlers for navbar buttons
  const handleNavbarRunCode = () => {
    console.log("Run code triggered from navbar");
    setRunCodeTrigger((prev) => prev + 1);
  };

  const handleNavbarSubmitCode = () => {
    console.log("Submit code triggered from navbar");
    setSubmitCodeTrigger((prev) => prev + 1);
  };

  const handleToggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  useEffect(() => {
    const keyboardShortcut = (e: KeyboardEvent) => {
      const isAlt = e.altKey;
      const isLeftArrow = e.key === "ArrowLeft";
      const isRightArrow = e.key === "ArrowRight";

      // Alt + Right Arrow to open sidebar
      if (isAlt && isRightArrow && !isSidebarOpen) {
        e.preventDefault();
        setIsSidebarOpen(true);
      }

      // Alt + Left Arrow to close sidebar
      else if (isAlt && isLeftArrow && isSidebarOpen) {
        e.preventDefault();
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener("keydown", keyboardShortcut);

    return () => {
      window.removeEventListener("keydown", keyboardShortcut);
    };
  }, [isSidebarOpen]);

  return (
    <SidebarProvider>
      <div className="h-screen w-screen flex flex-col">
        <ProblemNavbar
          onResetLayout={handleResetLayout}
          onRunCode={handleNavbarRunCode}
          onSubmitCode={handleNavbarSubmitCode}
          onToggleSidebar={handleToggleSidebar}
          code={code}
          language={language}
        />
        <ResizablePanels
          resetLayoutTrigger={resetLayoutTrigger}
          runCodeTrigger={runCodeTrigger}
          submitCodeTrigger={submitCodeTrigger}
          code={code}
          setCode={setCode}
          language={language}
          setLanguage={setLanguage}
        />
        {isSidebarOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={() => setIsSidebarOpen(false)}
            />

            {/* Sidebar */}
            <div className="fixed top-0 left-0 h-full z-50 transform transition-transform duration-300 ease-in-out">
              <ProblemSidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
              />
            </div>
          </>
        )}
      </div>
    </SidebarProvider>
  );
};

const ProblemDetailsPage = dynamic(
  () => Promise.resolve(ProblemDetailsPageContent),
  { ssr: false },
);

export default ProblemDetailsPage;
