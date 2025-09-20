import React from "react";
import CommentResizablePanels from "./commentResizablePanels/CommentResizablePanels";

type CommentEditorProps = {
  content: string;
  setContent: (value: string) => void;
  onSelectionChange?: (start: number, end: number) => void;
};

const CommentEditor: React.FC<CommentEditorProps> = ({
  content,
  setContent,
  onSelectionChange
}) => {
  return (
    <div className="h-full w-full">
      <CommentResizablePanels
        content={content}
        setContent={setContent}
        onSelectionChange={onSelectionChange}
      />
    </div>
  );
};
export default CommentEditor;
