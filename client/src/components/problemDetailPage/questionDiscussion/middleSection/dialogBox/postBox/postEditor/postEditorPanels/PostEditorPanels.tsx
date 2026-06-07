import React, { useEffect, useState, useRef, useCallback } from "react";
import PostMarkdownEditor from "../postMarkdownEditor/PostMarkdownEditor";
import PostMarkdownPreview from "../postMarkdownPreview/PostMarkdownPreview";
import { usePostStore } from "@/features/postStore";
import { useSearchParams } from "next/navigation";
import { PostEditorPanelsSkeleton } from "./PostEditorPanelsSkeleton";
import AIWritePanel, { AIMode, AITone } from "../../postToolbar/generatePost/AIWritePanel";

type PostEditorPanelsProps = {
  content: string;
  setContent: (value: string) => void;
  onSelectionChange?: (start: number, end: number) => void;
  onResetReady?: (fn: () => void) => void;
  setOriginalTemplate?: (template: string) => void;
  hasChanges?: boolean;
  isDraftMode?: boolean;
  isStreaming: boolean;
  // AI panel props
  isAIPanelOpen: boolean;
  aiPrompt: string;
  aiMode: AIMode;
  aiTone: AITone;
  promptHistory: string[];
  hasGenerated: boolean;
  isGeneratingPost: boolean;
  problemTitle?: string;
  onAiPromptChange: (value: string) => void;
  onAiGenerate: () => void;
  onAiAbort: () => void;
  onAiRegenerate: () => void;
  onAiCancel: () => void;
  onAiModeChange: (mode: AIMode) => void;
  onAiToneChange: (tone: AITone) => void;
};

const PostEditorPanels: React.FC<PostEditorPanelsProps> = ({
  content,
  setContent,
  onSelectionChange,
  onResetReady,
  setOriginalTemplate,
  hasChanges,
  isDraftMode = false,
  isStreaming,
  isAIPanelOpen,
  aiPrompt,
  aiMode,
  aiTone,
  promptHistory,
  hasGenerated,
  isGeneratingPost,
  problemTitle,
  onAiPromptChange,
  onAiGenerate,
  onAiAbort,
  onAiRegenerate,
  onAiCancel,
  onAiModeChange,
  onAiToneChange,
}) => {
  const [problemTitle_, setProblemTitle_] = useState<string | null>(null);
  const hasLoadedInitialContent = useRef(false);
  const originalTemplateRef = useRef<string>("");

  const {
    getPostBaseTemplate,
    isPostBaseTemplateLoading,
    postBaseTemplateError,
    postBaseTemplate,
  } = usePostStore();

  const searchParams = useSearchParams();

  useEffect(() => {
    const title = searchParams.get("title");
    setProblemTitle_(title);

    const loadTemplate = async () => {
      if (!title || hasLoadedInitialContent.current || isDraftMode) return;
      try {
        await getPostBaseTemplate(title);
      } catch (error) {
        console.error("Error fetching post template:", error);
      }
    };
    loadTemplate();
  }, [searchParams, getPostBaseTemplate, isDraftMode]);

  useEffect(() => {
    if (
      postBaseTemplate &&
      !hasLoadedInitialContent.current &&
      content === "" &&
      !isDraftMode
    ) {
      setContent(postBaseTemplate);
      originalTemplateRef.current = postBaseTemplate;
      if (setOriginalTemplate) setOriginalTemplate(postBaseTemplate);
      hasLoadedInitialContent.current = true;
    }
  }, [postBaseTemplate, content, setContent, setOriginalTemplate, isDraftMode]);

  const handleReset = useCallback(() => {
    if (postBaseTemplate && !isDraftMode) {
      setContent(postBaseTemplate);
      if (setOriginalTemplate) setOriginalTemplate(postBaseTemplate);
    }
  }, [postBaseTemplate, isDraftMode, setContent, setOriginalTemplate]);

  useEffect(() => {
    if (onResetReady && postBaseTemplate) {
      onResetReady(handleReset);
    }
  }, [onResetReady, handleReset, postBaseTemplate]);

  if (isPostBaseTemplateLoading && content === "" && !isDraftMode) {
    return (
      <div className="h-full flex items-center justify-center">
        <PostEditorPanelsSkeleton />
      </div>
    );
  }

  if (postBaseTemplateError && content === "" && !isDraftMode) {
    return (
      <div className="h-full flex items-center justify-center text-red-500 text-lg">
        {postBaseTemplateError}
      </div>
    );
  }

  return (
    <div className="h-full w-full flex">
      {/* Left Panel — editor + floating AI panel */}
      <div className="w-1/2 border mr-1 rounded-bl-xl overflow-hidden">
        {/* position:relative scopes the absolutely positioned AIWritePanel */}
        <div className="relative h-full w-full overflow-y-auto overflow-x-hidden">
          <PostMarkdownEditor
            content={content}
            setContent={setContent}
            onSelectionChange={onSelectionChange}
            onReset={handleReset}
          />

          {/* AI panel — floats over the bottom of the textarea.
              left offset clears the line-numbers column (~36px). */}
          <AIWritePanel
            isOpen={isAIPanelOpen}
            aiPrompt={aiPrompt}
            isGenerating={isGeneratingPost}
            hasGenerated={hasGenerated}
            mode={aiMode}
            tone={aiTone}
            promptHistory={promptHistory}
            problemTitle={problemTitle}
            onPromptChange={onAiPromptChange}
            onGenerate={onAiGenerate}
            onAbort={onAiAbort}
            onRegenerate={onAiRegenerate}
            onCancel={onAiCancel}
            onModeChange={onAiModeChange}
            onToneChange={onAiToneChange}
          />
        </div>
      </div>

      {/* Divider */}
      <div className="w-1 bg-border rounded-md my-1" />

      {/* Right Panel — preview with streaming cursor */}
      <div className="w-1/2 border ml-1 rounded-br-xl overflow-hidden">
        <div className="h-full w-full overflow-y-auto overflow-x-hidden">
          <PostMarkdownPreview markdown={content} isStreaming={isStreaming} />
        </div>
      </div>
    </div>
  );
};

export default PostEditorPanels;
