import React from "react";
import CommentResizablePanels from "./commentResizablePanels/CommentResizablePanels";

type CommentEditorProps = {};

const CommentEditor: React.FC<CommentEditorProps> = () => {
  return (
    <div className="h-full w-full">
      <CommentResizablePanels />
    </div>
  );
};
export default CommentEditor;
