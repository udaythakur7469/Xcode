import React, { forwardRef } from "react";
import CommentResizablePanels, {
  CommentResizablePanelsRef,
} from "./commentResizablePanels/CommentResizablePanels";

type CommentEditorProps = {
  content: string;
  setContent: (value: string) => void;
  onSelectionChange?: (start: number, end: number) => void;
};

const CommentEditor = forwardRef<CommentResizablePanelsRef, CommentEditorProps>(
  ({ content, setContent, onSelectionChange }, ref) => {
    return (
      <div className="h-full w-full">
        <CommentResizablePanels
          ref={ref}
          content={content}
          setContent={setContent}
          onSelectionChange={onSelectionChange}
        />
      </div>
    );
  }
);

CommentEditor.displayName = "CommentEditor";

export default CommentEditor;
