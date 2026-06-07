import React from "react";
import PostEditorPanels from "./postEditorPanels/PostEditorPanels";
import type { AIMode, AITone } from "../postToolbar/generatePost/AIWritePanel";

type PostEditorProps = {
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

const PostEditor: React.FC<PostEditorProps> = ({
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
  return (
    <div className="h-full w-full">
      <PostEditorPanels
        content={content}
        setContent={setContent}
        onSelectionChange={onSelectionChange}
        onResetReady={onResetReady}
        setOriginalTemplate={setOriginalTemplate}
        hasChanges={hasChanges}
        isDraftMode={isDraftMode}
        isStreaming={isStreaming}
        isAIPanelOpen={isAIPanelOpen}
        aiPrompt={aiPrompt}
        aiMode={aiMode}
        aiTone={aiTone}
        promptHistory={promptHistory}
        hasGenerated={hasGenerated}
        isGeneratingPost={isGeneratingPost}
        problemTitle={problemTitle}
        onAiPromptChange={onAiPromptChange}
        onAiGenerate={onAiGenerate}
        onAiAbort={onAiAbort}
        onAiRegenerate={onAiRegenerate}
        onAiCancel={onAiCancel}
        onAiModeChange={onAiModeChange}
        onAiToneChange={onAiToneChange}
      />
    </div>
  );
};

export default PostEditor;
