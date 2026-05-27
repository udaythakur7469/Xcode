import React from "react";
import PostEditorPanels from "./postEditorPanels/PostEditorPanels";

type PostEditorProps = {
  content: string;
  setContent: (value: string) => void;
  onSelectionChange?: (start: number, end: number) => void;
  onResetReady?: () => void;
  setOriginalTemplate?: (template: string) => void;
  hasChanges?: boolean;
  isDraftMode?: boolean;
  isAIPanelOpen: boolean;
  aiPrompt: string;
  isGeneratingPost: boolean;
  onAiPromptChange: (value: string) => void;
  onAiGenerate: () => void;
  onAiCancel: () => void;
};

const PostEditor: React.FC<PostEditorProps> = ({
  content,
  setContent,
  onSelectionChange,
  onResetReady,
  setOriginalTemplate,
  hasChanges,
  isDraftMode = false,
  isAIPanelOpen,
  aiPrompt,
  isGeneratingPost,
  onAiPromptChange,
  onAiGenerate,
  onAiCancel,
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
        isAIPanelOpen={isAIPanelOpen}
        aiPrompt={aiPrompt}
        isGeneratingPost={isGeneratingPost}
        onAiPromptChange={onAiPromptChange}
        onAiGenerate={onAiGenerate}
        onAiCancel={onAiCancel}
      />
    </div>
  );
};

export default PostEditor;
