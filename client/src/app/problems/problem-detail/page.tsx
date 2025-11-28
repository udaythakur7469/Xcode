"use client";

import React, { useState } from "react";
import ResizablePanels from "@/components/problemDetailPage/resizablePanels/ResizablePanels";
import ProblemNavbar from "@/components/problemDetailPage/navbar/ProblemNavbar";
import ProblemSidebar from "@/components/problemDetailPage/navbar/sidebar/ProblemSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

const ProblemDetailsPage: React.FC = () => {
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

export default ProblemDetailsPage;
