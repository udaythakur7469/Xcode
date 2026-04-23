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
import { useCommentPanel } from "@/context/commentPanelContext";
import { useRouter, useSearchParams } from "next/navigation";

type QuestionTabsProps = {
  showResultsTab?: boolean;
  onCloseResultsTab?: () => void;
  onMaximize?: () => void;
  isMaximized?: boolean;
};

// Valid tabs that can appear in the URL
const VALID_URL_TABS = [
  "description",
  "editorial",
  "submissions",
  "discussion",
] as const;
type ValidUrlTab = (typeof VALID_URL_TABS)[number];

const resolveTabFromParam = (param: string | null): string => {
  if (param && (VALID_URL_TABS as readonly string[]).includes(param)) {
    return param;
  }
  return "description";
};

const QuestionTabs: React.FC<QuestionTabsProps> = ({
  showResultsTab = false,
  onCloseResultsTab,
  onMaximize,
  isMaximized = false,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // previousTab is local state only — used for slide animation direction
  const [previousTab, setPreviousTab] = useState("description");
  const [resultsVisible, setResultsVisible] = useState(false);

  // Derive active tab from URL. `results` is never in URL — it's driven by showResultsTab prop.
  const tabParam = searchParams.get("tab");
  const urlResolvedTab = resolveTabFromParam(tabParam);
  const activeTab =
    resultsVisible && showResultsTab ? "results" : urlResolvedTab;

  const { clearSubmitCodeResult } = useSubmissionStore();
  const { setIsOpen } = useCommentPanel();

  const handleMaximizeMinimize = useCallback(() => {
    if (onMaximize) onMaximize();
  }, [onMaximize]);

  // Build updated URL with new tab param, preserving all other params
  const buildTabUrl = (newTab: string): string => {
    const params = new URLSearchParams(searchParams.toString());
    if ((VALID_URL_TABS as readonly string[]).includes(newTab)) {
      params.set("tab", newTab);
    } else {
      params.delete("tab");
    }
    // Remove post param when switching away from discussion
    if (newTab !== "discussion") {
      params.delete("post");
    }
    return `?${params.toString()}`;
  };

  const handleTabChange = (newTab: string) => {
    setPreviousTab(activeTab);

    if (activeTab === "discussion") {
      setIsOpen(false);
    }

    if (newTab === "results") {
      setResultsVisible(true);
      return;
    }

    setResultsVisible(false);
    router.replace(buildTabUrl(newTab));
  };

  // When showResultsTab becomes true, visually switch to results
  // (no URL change — results is not a shareable state)
  useEffect(() => {
    if (showResultsTab) {
      setPreviousTab(urlResolvedTab);
      setResultsVisible(true);
    } else {
      setResultsVisible(false);
    }
  }, [showResultsTab]);

  // Keyboard shortcut: Alt+W closes results tab, falls back to description
  useEffect(() => {
    const keyboardShortcut = (e: KeyboardEvent) => {
      const isAlt = e.altKey;
      const isW = e.key === "w" || e.key === "W";

      if (isAlt && isW && showResultsTab) {
        e.preventDefault();
        if (onCloseResultsTab) onCloseResultsTab();
        clearSubmitCodeResult();
        setResultsVisible(false);
        setPreviousTab("results");
      }
    };

    window.addEventListener("keydown", keyboardShortcut);
    return () => window.removeEventListener("keydown", keyboardShortcut);
  }, [showResultsTab, onCloseResultsTab, clearSubmitCodeResult, searchParams]);

  // Keyboard shortcut: Ctrl+Right to maximize
  useEffect(() => {
    const keyboardShortcut = (e: KeyboardEvent) => {
      const isControl = e.ctrlKey || e.metaKey;
      const isRightArrow = e.key === "ArrowRight";
      if (isControl && isRightArrow && !isMaximized) {
        e.preventDefault();
        handleMaximizeMinimize();
      }
    };

    window.addEventListener("keydown", keyboardShortcut);
    return () => window.removeEventListener("keydown", keyboardShortcut);
  }, [isMaximized, handleMaximizeMinimize]);

  // Keyboard shortcuts: Alt+1..5 to switch tabs
  useEffect(() => {
    const keyboardShortcut = (e: KeyboardEvent) => {
      if (!e.altKey) return;
      e.preventDefault();

      const tabsWithResults = [
        "description",
        "editorial",
        "results",
        "submissions",
        "discussion",
      ];
      const tabsWithout = [
        "description",
        "editorial",
        "submissions",
        "discussion",
      ];
      const tabList = showResultsTab ? tabsWithResults : tabsWithout;
      const index = parseInt(e.key) - 1;

      if (index >= 0 && index < tabList.length) {
        handleTabChange(tabList[index]);
      }
    };

    window.addEventListener("keydown", keyboardShortcut);
    return () => window.removeEventListener("keydown", keyboardShortcut);
  }, [showResultsTab, activeTab, searchParams]);

  const onResultsClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onCloseResultsTab) onCloseResultsTab();
    clearSubmitCodeResult();
    setResultsVisible(false);
    setPreviousTab("results");
  };

  // Animation direction
  const getTabIndex = (tabValue: string) => {
    const tabs = showResultsTab
      ? ["description", "editorial", "results", "submissions", "discussion"]
      : ["description", "editorial", "submissions", "discussion"];
    return tabs.indexOf(tabValue);
  };

  const getSlideDirection = () => {
    const currentIndex = getTabIndex(activeTab);
    const previousIndex = getTabIndex(previousTab);
    return currentIndex > previousIndex ? 1 : -1;
  };

  const slideDirection = getSlideDirection();
  const tabVariants = {
    enter: { x: slideDirection * 100 + "%", opacity: 1 },
    center: { x: 0, opacity: 1 },
    exit: { x: slideDirection * -100 + "%", opacity: 1 },
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
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 cursor-pointer hover:text-red-500 rounded-sm p-0.5"
                    size={24}
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
