import React, { forwardRef } from "react";
import PostResizablePanels, {
  PostResizablePanelsPropsRef,
} from "./postResizablePanels/PostResizablePanels";

type PostEditorProps = {
  content: string;
  setContent: (value: string) => void;
  onSelectionChange?: (start: number, end: number) => void;
};

const PostEditor = forwardRef<PostResizablePanelsPropsRef, PostEditorProps>(
  ({ content, setContent, onSelectionChange }, ref) => {
    return (
      <div className="h-full w-full">
        <PostResizablePanels
          ref={ref}
          content={content}
          setContent={setContent}
          onSelectionChange={onSelectionChange}
        />
      </div>
    );
  }
);

PostEditor.displayName = "PostEditor";

export default PostEditor;
