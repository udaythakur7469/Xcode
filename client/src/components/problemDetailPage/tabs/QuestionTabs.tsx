import React, { useCallback, useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  BookOpen,
  CheckCircle,
  Flame,
  GalleryVerticalEnd,
  Maximize,
  Minimize,
  NotebookText,
  X,
} from "lucide-react";
import QuestionData from "../questionDescription/question/QuestionData";
import QuestionEditorial from "../questionEditorial/editorial/QuestionEditorial";
import SubmissionTabs from "../questionSubmissions/submissionTabs/SubmissionTabs";
import { AnimatePresence, motion } from "framer-motion";
import DiscussionSection from "../questionDiscussion/DiscussionSection";
import QuestionCodeResults from "../questionResults/QuestionResults";
import { useSubmissionStore } from "@/features/submissionStore";

type QuestionTabsProps = {
  showResultsTab?: boolean;
  onCloseResultsTab?: () => void;
  onMaximize?: () => void;
  isMaximized?: boolean;
};

const SESSION_KEY = "lastOpenedTab";

const QuestionTabs: React.FC<QuestionTabsProps> = ({
  showResultsTab = false,
  onCloseResultsTab,
  onMaximize,
  isMaximized = false,
}) => {
  const [activeTab, setActiveTab] = useState("description");
  const [previousTab, setPreviousTab] = useState("description");
  const { clearSubmitCodeResult } = useSubmissionStore();

  const handleMaximizeMinimize = useCallback(() => {
    if (onMaximize) {
      onMaximize();
    }
  }, [onMaximize]);

  // Get tab order index for animation direction
  const getTabIndex = (tabValue: string) => {
    const tabs = showResultsTab
      ? ["description", "editorial", "results", "submissions", "discussion"]
      : ["description", "editorial", "submissions", "discussion"];
    return tabs.indexOf(tabValue);
  };

  // Determine slide direction based on tab order
  const getSlideDirection = () => {
    const currentIndex = getTabIndex(activeTab);
    const previousIndex = getTabIndex(previousTab);
    return currentIndex > previousIndex ? 1 : -1;
  };

  const handleTabChange = (newTab: string) => {
    setPreviousTab(activeTab);
    setActiveTab(newTab);
  };

  useEffect(() => {
    if (showResultsTab) {
      setPreviousTab(activeTab);
      setActiveTab("results");
    }
  }, [showResultsTab]);

  useEffect(() => {
    const savedTab = sessionStorage.getItem("lastOpenedTab");
    if (savedTab && savedTab !== "results") {
      setActiveTab(savedTab);
      setPreviousTab(savedTab);
    } else {
      setActiveTab("description");
      setPreviousTab("description");
    }
  }, []);

  useEffect(() => {
    if (activeTab && activeTab !== "results") {
      sessionStorage.setItem("lastOpenedTab", activeTab);
    }
  }, [activeTab]);

  useEffect(() => {
    const keyboardShortcut = (e: KeyboardEvent) => {
      const isAlt = e.altKey;
      const isW = e.key === "w" || e.key === "W";

      if (isAlt && isW && showResultsTab) {
        e.preventDefault();
        if (onCloseResultsTab) {
          onCloseResultsTab();
        }
        clearSubmitCodeResult();
        const lastOpenedTab =
          sessionStorage.getItem(SESSION_KEY) || "description";
        handleTabChange(lastOpenedTab);
      }
    };

    window.addEventListener("keydown", keyboardShortcut);

    return () => {
      window.removeEventListener("keydown", keyboardShortcut);
    };
  }, [showResultsTab, onCloseResultsTab, clearSubmitCodeResult, activeTab]);

  useEffect(() => {
    const keyboardShortcut = (e: KeyboardEvent) => {
      const isControl = e.ctrlKey || e.metaKey;
      const isRightArrow = e.key === "ArrowRight";

      // Ctrl + Right Arrow to maximize (when not maximized)
      if (isControl && isRightArrow && !isMaximized) {
        e.preventDefault();
        handleMaximizeMinimize();
      }
    };

    window.addEventListener("keydown", keyboardShortcut);

    return () => {
      window.removeEventListener("keydown", keyboardShortcut);
    };
  }, [isMaximized, handleMaximizeMinimize]);

  useEffect(() => {
    const keyboardShortcut = (e: KeyboardEvent) => {
      const isAlt = e.altKey;
      const key = e.key;

      if (isAlt) {
        e.preventDefault();

        // If results tab is showing
        if (showResultsTab) {
          switch (key) {
            case "1":
              handleTabChange("description");
              break;
            case "2":
              handleTabChange("editorial");
              break;
            case "3":
              handleTabChange("results");
              break;
            case "4":
              handleTabChange("submissions");
              break;
            case "5":
              handleTabChange("discussion");
              break;
          }
        } else {
          // If results tab is not showing
          switch (key) {
            case "1":
              handleTabChange("description");
              break;
            case "2":
              handleTabChange("editorial");
              break;
            case "3":
              handleTabChange("submissions");
              break;
            case "4":
              handleTabChange("discussion");
              break;
          }
        }
      }
    };

    window.addEventListener("keydown", keyboardShortcut);

    return () => {
      window.removeEventListener("keydown", keyboardShortcut);
    };
  }, [showResultsTab, activeTab]);

  const onResultsClose = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the tab change
    if (onCloseResultsTab) {
      onCloseResultsTab(); // Call parent to hide the tab
    }
    clearSubmitCodeResult();
    const lastOpenedTab = sessionStorage.getItem(SESSION_KEY) || "description";
    handleTabChange(lastOpenedTab);
  };

  // Animation variants for tab content - Pure slide with no fade
  const slideDirection = getSlideDirection();
  const tabVariants = {
    enter: {
      x: slideDirection * 100 + "%",
      opacity: 1,
    },
    center: {
      x: 0,
      opacity: 1,
    },
    exit: {
      x: slideDirection * -100 + "%",
      opacity: 1,
    },
  };

  return (
    <div className="h-full w-full pt-0 mt-0">
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="h-full w-full"
      >
        <TabsList className="w-full flex flex-row justify-stretch">
          <TabsTrigger
            value="description"
            className="hover:bg-gray-100 hover:text-black flex-1 text-center"
          >
            <NotebookText size={18} className="mr-1 text-blue-500" />
            <p className="text-md">Description</p>
          </TabsTrigger>
          <TabsTrigger
            value="editorial"
            className="hover:bg-gray-100 hover:text-black flex-1 text-center"
          >
            <BookOpen size={18} className="mr-1 text-yellow-500" />
            <p className="text-md">Editorial</p>
          </TabsTrigger>
          <AnimatePresence>
            {showResultsTab && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.8, opacity: 0, y: 20 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <TabsTrigger
                  value="results"
                  className="hover:bg-gray-100 hover:text-black flex-1 text-center relative"
                >
                  <div className="flex items-center justify-center">
                    <CheckCircle size={18} className="mr-1 text-green-500" />
                    <p className="text-md mr-8">Results</p>
                  </div>
                  <X
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 cursor-pointer hover:bg-gray-200 rounded-sm p-0.5"
                    size={18}
                    onClick={onResultsClose}
                  />
                </TabsTrigger>
              </motion.div>
            )}
          </AnimatePresence>
          <TabsTrigger
            value="submissions"
            className="hover:bg-gray-100 hover:text-black flex-1 text-center"
          >
            <GalleryVerticalEnd size={18} className="mr-1 text-green-500" />
            <p className="text-md">Submissions</p>
          </TabsTrigger>
          <TabsTrigger
            value="discussion"
            className="hover:bg-gray-100 hover:text-black flex-1 text-center"
          >
            <Flame size={18} className="mr-1 text-orange-500" />
            <p className="text-md">Discussion</p>
          </TabsTrigger>
          {/* Toggle between Maximize and Minimize icons */}
          {isMaximized ? (
            <HoverCard>
              <HoverCardTrigger asChild>
                <Minimize
                  className="ml-2 mr-2 cursor-pointer text-yellow-500 hover:text-yellow-600"
                  size={20}
                  onClick={handleMaximizeMinimize}
                />
              </HoverCardTrigger>
              <HoverCardContent className="mr-5 p-1" side="right">
                Minimize
              </HoverCardContent>
            </HoverCard>
          ) : (
            <HoverCard>
              <HoverCardTrigger asChild>
                <Maximize
                  className="ml-2 mr-2 cursor-pointer text-yellow-500 hover:text-yellow-600"
                  size={20}
                  onClick={handleMaximizeMinimize}
                />
              </HoverCardTrigger>
              <HoverCardContent className="mr-5 p-1" side="right">
                Maximize
              </HoverCardContent>
            </HoverCard>
          )}
        </TabsList>
        <div className="w-full h-full overflow-hidden relative">
          <AnimatePresence mode="sync" initial={false}>
            {activeTab === "description" && (
              <motion.div
                key="description"
                variants={tabVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="absolute inset-0 w-full h-full"
              >
                <TabsContent value="description" className="h-full m-0">
                  <QuestionData />
                </TabsContent>
              </motion.div>
            )}
            {activeTab === "editorial" && (
              <motion.div
                key="editorial"
                variants={tabVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="absolute inset-0 w-full h-full"
              >
                <TabsContent value="editorial" className="h-full m-0">
                  <QuestionEditorial />
                </TabsContent>
              </motion.div>
            )}
            {activeTab === "results" && (
              <motion.div
                key="results"
                variants={tabVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="absolute inset-0 w-full h-full"
              >
                <TabsContent value="results" className="h-full m-0">
                  <QuestionCodeResults />
                </TabsContent>
              </motion.div>
            )}
            {activeTab === "submissions" && (
              <motion.div
                key="submissions"
                variants={tabVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="absolute inset-0 w-full h-full"
              >
                <TabsContent value="submissions" className="h-full m-0">
                  <SubmissionTabs />
                </TabsContent>
              </motion.div>
            )}
            {activeTab === "discussion" && (
              <motion.div
                key="discussion"
                variants={tabVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="absolute inset-0 w-full h-full"
              >
                <TabsContent value="discussion" className="h-full m-0">
                  <DiscussionSection />
                </TabsContent>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Tabs>
    </div>
  );
};

export default QuestionTabs;
