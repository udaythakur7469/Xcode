"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
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
import { CodeEditorSkeleton } from "./CodeEditorSkeleton";
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
  const getCodeDraftKey = (problemTitle: string, language: string) =>
    `xcode_code_draft:${problemTitle}:${language}`;

  const [theme, setTheme] = useState<string>("dark");
  const [fontSize, setFontSize] = useState<number>(14);
  const [problemId, setProblemId] = useState<number | null>(null);
  // Gates the skeleton in addition to isBaseCodeLoading, specifically for
  // Reset: guarantees the skeleton never hides until the freshly-fetched
  // base code has ALSO been applied to `code`, so there's no frame where
  // the editor is visible again but still showing the just-deleted draft.
  const [isResettingCode, setIsResettingCode] = useState(false);

  // CodeMirror's onChange fires for ANY document change — including the
  // ones WE make programmatically (hydrating a saved draft, or resetting
  // to the base template) — not just real user keystrokes. A simple
  // "next onChange is programmatic" boolean flag is unreliable here: some
  // programmatic updates cause onChange to fire more than once (or fire
  // after an unrelated CodeMirror unmount/remount during the loading
  // skeleton swap), so the flag can get consumed by the wrong firing.
  // Instead we remember the exact VALUE we just set programmatically, and
  // compare against it in onChange: any firing whose value still matches
  // is a programmatic echo (however many times it fires) and gets
  // ignored; the moment the value diverges — a real keystroke — it's
  // persisted, from then on, every time.
  const lastProgrammaticValueRef = useRef<string | null>(null);

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
    if (baseCode == null || !problemTitle) return;
    const savedDraft = localStorage.getItem(
      getCodeDraftKey(problemTitle, language),
    );
    const nextValue = savedDraft ?? baseCode;
    lastProgrammaticValueRef.current = nextValue;
    setCode(nextValue);
  }, [baseCode, problemTitle, language, setCode]);

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
      console.log("Code executed");
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
      console.log("Code submitted");
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
    if (problemTitle) {
      localStorage.removeItem(getCodeDraftKey(problemTitle, language));
    }
    if (problemId) {
      // isResettingCode keeps the skeleton up for the ENTIRE reset — not
      // just for however long the store's own isBaseCodeLoading flag
      // happens to be true. It only turns back off in the same
      // synchronous block as the setCode(freshBaseCode) call below (no
      // await in between), so React can only ever commit a frame where
      // the skeleton is down AND the code is already correct — never a
      // frame with the editor visible but still showing the old draft.
      setIsResettingCode(true);
      try {
        await fetchBaseClassCode(problemId, language);
        // Read the freshly-fetched base code directly from the store
        // instead of relying on the `[baseCode]`-watching effect above: if
        // the fetched template string happens to be identical to what was
        // already in the store (e.g. resetting without a language change),
        // that effect's dependency wouldn't change and would silently
        // never re-run, leaving the just-deleted draft on screen.
        const freshBaseCode = useSubmissionStore.getState().baseCode ?? "";
        lastProgrammaticValueRef.current = freshBaseCode;
        setCode(freshBaseCode);
      } finally {
        setIsResettingCode(false);
      }
    }
  }, [problemId, language, fetchBaseClassCode, problemTitle, setCode]);

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
          {isBaseCodeLoading || isResettingCode ? (
            <CodeEditorSkeleton />
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
                const isProgrammaticEcho =
                  value === lastProgrammaticValueRef.current;
                if (!isProgrammaticEcho && problemTitle) {
                  localStorage.setItem(
                    getCodeDraftKey(problemTitle, language),
                    value,
                  );
                }
              }}
              style={{ fontSize: `${fontSize}px`, height: "100%" }}
            />
          )}
        </div>

        {/* Footer with Run Code Button */}
        <div className="h-[50px] bg-secondary rounded-md flex items-center justify-start px-4 gap-x-5">
          <div className="ml-5 space-x-5">
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
        </div>
      </>
    </div>
  );
};

export default CodeEditor;
