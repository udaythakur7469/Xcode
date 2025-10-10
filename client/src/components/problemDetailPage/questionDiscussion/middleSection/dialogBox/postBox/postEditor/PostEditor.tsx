import React from "react";
import PostEditorPanels from "./postEditorPanels/PostEditorPanels";

type PostEditorProps = {
  content: string;
  setContent: (value: string) => void;
  onSelectionChange?: (start: number, end: number) => void;
  onResetReady?: () => void;
  setOriginalTemplate?: (template: string) => void;
  hasChanges?: boolean;
};

const PostEditor: React.FC<PostEditorProps> = ({
  content,
  setContent,
  onSelectionChange,
  onResetReady,
  setOriginalTemplate,
  hasChanges,
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
      />
    </div>
  );
};

PostEditor.displayName = "PostEditor";

export default PostEditor;
