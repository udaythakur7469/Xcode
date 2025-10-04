import React from "react";
import PostEditorPanels from "./postEditorPanels/PostEditorPanels";

type PostEditorProps = {
  content: string;
  setContent: (value: string) => void;
  onSelectionChange?: (start: number, end: number) => void;
};

const PostEditor: React.FC<PostEditorProps> = ({
  content,
  setContent,
  onSelectionChange,
}) => {
  return (
    <div className="h-full w-full">
      <PostEditorPanels
        content={content}
        setContent={setContent}
        onSelectionChange={onSelectionChange}
      />
    </div>
  );
};

PostEditor.displayName = "PostEditor";

export default PostEditor;
