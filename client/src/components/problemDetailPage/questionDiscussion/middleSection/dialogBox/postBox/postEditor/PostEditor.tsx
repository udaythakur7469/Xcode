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
};

const PostEditor: React.FC<PostEditorProps> = ({
  content,
  setContent,
  onSelectionChange,
  onResetReady,
  setOriginalTemplate,
  hasChanges,
  isDraftMode = false,
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
      />
    </div>
  );
};

export default PostEditor;
