"use client";

import React, { useState, useEffect, useCallback } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { cpp } from "@codemirror/lang-cpp";
import { java } from "@codemirror/lang-java";
import { dracula, githubLight, githubDark } from "@uiw/codemirror-themes-all";
import LangDropdown from "../dropdowns/LangDropdown";
import ThemeDropdown from "../dropdowns/ThemeDropdown";
import FontSizeDropdown from "../dropdowns/FontSizeDropdown";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { History, Maximize, Minimize } from "lucide-react";
import { MoonLoader } from "react-spinners";
import { useProblemStore } from "@/features/problemStore";
import { useSearchParams } from "next/navigation";
import { useSubmissionStore } from "@/features/submissionStore";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useCommentPanel } from "@/context/commentPanelContext";
import PostComments from "../../questionDiscussion/bottomSection/postCard/fullPostPanel/PostComments";
import { AnimatePresence, motion } from "framer-motion";

type CodeEditorProps = {
  onCodeSubmit?: () => void;
  onCodeRun?: () => void;
  onMaximize?: () => void;
  isMaximized?: boolean;
  runCodeTrigger?: number;
  submitCodeTrigger?: number;
  code: string;
  setCode: React.Dispatch<React.SetStateAction<string>>;
  language: string;
  setLanguage: React.Dispatch<React.SetStateAction<string>>;
};

const CodeEditor: React.FC<CodeEditorProps> = ({
  onCodeSubmit,
  onCodeRun,
  onMaximize,
  isMaximized = false,
  runCodeTrigger,
  submitCodeTrigger,
  code,
  setCode,
  language,
  setLanguage,
}) => {
  const [theme, setTheme] = useState<string>("dark");
  const [fontSize, setFontSize] = useState<number>(14);
  const [problemId, setProblemId] = useState<number | null>(null);

  const {
    baseCode,
    isBaseCodeLoading,
    baseCodeError,
    fetchBaseClassCode,
    runCode,
    submitCode,
    isRunningCode,
    isSubmittingCode,
  } = useSubmissionStore();
  const { getProblemByTitle } = useProblemStore();
  const searchParams = useSearchParams();
  const problemTitle = searchParams.get("title");

  useEffect(() => {
    const fetchProblemDetails = async () => {
      if (!problemTitle) return;

      try {
        const problemDetails = await getProblemByTitle(problemTitle);
        setProblemId(problemDetails.id);
      } catch (error) {
        console.error("Error fetching problem details:", error);
      }
    };

    fetchProblemDetails();
  }, [problemTitle, getProblemByTitle]);

  useEffect(() => {
    if (problemId) {
      fetchBaseClassCode(problemId, language);
    }
  }, [problemId, language, fetchBaseClassCode]);

  useEffect(() => {
    if (baseCode) {
      setCode(baseCode);
    }
  }, [baseCode]);

  const handleRunCode = useCallback(async () => {
    if (isRunningCode || isSubmittingCode) {
      return;
    }
    if (!problemTitle) {
      toast.error("Problem title not found");
      return;
    }

    if (!code.trim()) {
      toast.error("Please write some code first");
      return;
    }

    try {
      if (onCodeRun) {
        onCodeRun();
      }
      await runCode(language, code, problemTitle);
      toast.success("Code executed");
    } catch (error) {
      toast.error("Failed to run code");
      console.error("runCodeError", error);
    }
  }, [
    isRunningCode,
    isSubmittingCode,
    problemTitle,
    code,
    onCodeRun,
    runCode,
    language,
  ]);

  const handleSubmitCode = useCallback(async () => {
    if (isRunningCode || isSubmittingCode) {
      return;
    }
    if (!problemTitle) {
      toast.error("Problem title not found");
      return;
    }

    if (!code.trim()) {
      toast.error("Please write some code first");
      return;
    }

    try {
      if (onCodeSubmit) {
        onCodeSubmit();
      }
      await submitCode(language, code, problemTitle);
      toast.success("Code submitted");
    } catch (error) {
      toast.error("Failed to submit code");
      console.error("submitCodeError", error);
    }
  }, [
    isRunningCode,
    isSubmittingCode,
    problemTitle,
    code,
    onCodeSubmit,
    submitCode,
    language,
  ]);

  const handleResetCode = useCallback(async () => {
    if (problemId) {
      await fetchBaseClassCode(problemId, language);
      setCode(baseCode || "");
    }
  }, [problemId, language, fetchBaseClassCode, baseCode, setCode]);

  const handleMaximizeMinimize = useCallback(() => {
    if (onMaximize) {
      onMaximize();
    }
  }, [onMaximize]);

  // Add useEffect to handle run code trigger from navbar
  useEffect(() => {
    if (runCodeTrigger && runCodeTrigger > 0) {
      console.log("Run code triggered in CodeEditor from navbar");
      handleRunCode();
    }

    const keyboardShortcut = (e: KeyboardEvent) => {
      const isControl = e.ctrlKey || e.metaKey;
      const isKey = e.key === "'";

      if (isControl && isKey) {
        e.preventDefault();
        handleRunCode();
      }
    };

    window.addEventListener("keydown", keyboardShortcut);

    return () => {
      window.removeEventListener("keydown", keyboardShortcut);
    };
  }, [runCodeTrigger, handleRunCode]);

  // Add useEffect to handle submit code trigger from navbar
  useEffect(() => {
    if (submitCodeTrigger && submitCodeTrigger > 0) {
      console.log("Submit code triggered in CodeEditor from navbar");
      handleSubmitCode();
    }

    const keyboardShortcut = (e: KeyboardEvent) => {
      const isControl = e.ctrlKey || e.metaKey;
      const isEnter = e.key === "Enter";

      if (isControl && isEnter) {
        e.preventDefault();
        handleSubmitCode();
      }
    };

    window.addEventListener("keydown", keyboardShortcut);

    return () => {
      window.removeEventListener("keydown", keyboardShortcut);
    };
  }, [submitCodeTrigger, handleSubmitCode]);

  useEffect(() => {
    const keyboardShortcut = (e: KeyboardEvent) => {
      const isControl = e.ctrlKey || e.metaKey;
      const isBackspace = e.key === "Backspace";

      if (isControl && isBackspace) {
        e.preventDefault();
        handleResetCode();
      }
    };

    window.addEventListener("keydown", keyboardShortcut);

    return () => {
      window.removeEventListener("keydown", keyboardShortcut);
    };
  }, [handleResetCode]);

  useEffect(() => {
    const keyboardShortcut = (e: KeyboardEvent) => {
      const isControl = e.ctrlKey || e.metaKey;
      const isLeftArrow = e.key === "ArrowLeft";

      // Ctrl + Right Arrow to maximize (when not maximized)
      if (isControl && isLeftArrow && !isMaximized) {
        e.preventDefault();
        e.stopPropagation();
        handleMaximizeMinimize();
      }
    };

    window.addEventListener("keydown", keyboardShortcut);

    return () => {
      window.removeEventListener("keydown", keyboardShortcut);
    };
  }, [isMaximized, handleMaximizeMinimize]);

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
  };

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
  };

  const handleFontSizeChange = (newSize: number) => {
    setFontSize(newSize);
  };

  const getLanguageExtension = () => {
    switch (language) {
      case "javascript":
        return javascript();
      case "python":
        return python();
      case "cpp":
        return cpp();
      case "java":
        return java();
      default:
        return cpp();
    }
  };

  const getTheme = () => {
    switch (theme) {
      case "light":
        return githubLight;
      case "dark":
        return githubDark;
      case "dracula":
        return dracula;
      default:
        return githubDark;
    }
  };

  const { isOpen } = useCommentPanel();

  return (
    <div className="h-full w-full flex flex-col">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "tween", duration: 0.3, ease: "easeInOut" }}
            className="absolute inset-0 z-[40]"
          >
            <PostComments
              isMaximized={isMaximized}
              handleMaximizeMinimize={handleMaximizeMinimize}
            />
          </motion.div>
        )}
      </AnimatePresence>
      <>
        {/* Toolbar */}
        <div className="h-[40px] bg-secondary rounded-md flex flex-row justify-between px-1 items-center">
          <div className="flex flex-row justify-start">
            {/* Language Dropdown */}
            <LangDropdown
              selectedLanguage={language}
              onLanguageChange={handleLanguageChange}
            />
            {/* Theme Dropdown */}
            <ThemeDropdown
              selectedTheme={theme}
              onThemeChange={handleThemeChange}
            />
            {/* Font Size Dropdown */}
            <FontSizeDropdown onFontSizeChange={handleFontSizeChange} />
          </div>
          <div className="flex justify-end mr-2 items-center space-x-3">
            {/* Reset Code Hover Card */}
            <HoverCard>
              <HoverCardTrigger asChild>
                <History
                  className="text-yellow-500 cursor-pointer"
                  onClick={handleResetCode}
                />
              </HoverCardTrigger>
              <HoverCardContent className="mr-5 p-1">
                Reset code
              </HoverCardContent>
            </HoverCard>
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
                <HoverCardContent className="mr-5 p-1">
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
                <HoverCardContent className="mr-5 p-1">
                  Maximize
                </HoverCardContent>
              </HoverCard>
            )}
          </div>
        </div>

        {/* CodeMirror Editor */}
        <div className="flex-grow h-[calc(100%-90px)]">
          {isBaseCodeLoading ? (
            <div className="h-full flex items-center justify-center">
              <MoonLoader color="#ffffff" size={50} />
            </div>
          ) : baseCodeError ? (
            <div className="h-full flex items-center justify-center text-red-500">
              {baseCodeError}
            </div>
          ) : (
            <CodeMirror
              value={code}
              height="100%"
              width="100%"
              extensions={[getLanguageExtension()]}
              theme={getTheme()} // Pass the theme extension directly
              onChange={(value) => {
                setCode(value);
              }}
              style={{ fontSize: `${fontSize}px`, height: "100%" }}
            />
          )}
        </div>

        {/* Footer with Run Code Button */}
        <div className="h-[50px] bg-secondary rounded-md flex items-center justify-end px-4 gap-x-5">
          <Button
            className="bg-blue-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleRunCode}
            disabled={isRunningCode || isSubmittingCode}
          >
            {isRunningCode ? "Running..." : "Run Code"}
          </Button>
          <Button
            className="bg-green-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleSubmitCode}
            disabled={isRunningCode || isSubmittingCode}
          >
            {isSubmittingCode ? "Submitting..." : "Submit Code"}
          </Button>
        </div>
      </>
    </div>
  );
};

export default CodeEditor;
