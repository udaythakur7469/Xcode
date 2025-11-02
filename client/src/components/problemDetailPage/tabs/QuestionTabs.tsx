import React, { useEffect, useState } from "react";
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

  useEffect(() => {
    if (showResultsTab) {
      setActiveTab("results");
    }
  }, [showResultsTab]);

  useEffect(() => {
    const savedTab = sessionStorage.getItem("lastOpenedTab");
    if (savedTab && savedTab !== "results") {
      setActiveTab(savedTab);
    } else {
      setActiveTab("description");
    }
  }, []);

  useEffect(() => {
    if (activeTab && activeTab !== "results") {
      sessionStorage.setItem("lastOpenedTab", activeTab);
    }
  }, [activeTab]);

  const onResultsClose = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the tab change
    if (onCloseResultsTab) {
      onCloseResultsTab(); // Call parent to hide the tab
    }
    const lastOpenedTab = sessionStorage.getItem(SESSION_KEY) || "description";
    setActiveTab(lastOpenedTab);
  };

  const handleMaximizeMinimize = () => {
    if (onMaximize) {
      onMaximize();
    }
  };

  return (
    <div className="h-full w-full pt-0 mt-0">
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
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
        <div className="w-full h-full">
          <TabsContent value="description">
            <QuestionData />
          </TabsContent>
          <TabsContent value="editorial">
            <QuestionEditorial />
          </TabsContent>
          <TabsContent value="results">
            <QuestionCodeResults />
          </TabsContent>
          <TabsContent value="submissions">
            <SubmissionTabs />
          </TabsContent>
          <TabsContent value="discussion">
            <DiscussionSection />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default QuestionTabs;
