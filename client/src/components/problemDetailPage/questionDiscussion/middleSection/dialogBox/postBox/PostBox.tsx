import React, { useCallback, useState } from "react";
import PostTitle from "./postTitle/PostTitle";
import PostToolbar from "./postToolbar/PostToolbar";
import PostEditor from "./postEditor/PostEditor";

type PostBoxProps = {};

const PostBox: React.FC<PostBoxProps> = () => {
  const [content, setContent] = useState<string>("");
  const [selectionStart, setSelectionStart] = useState(0);
  const [selectionEnd, setSelectionEnd] = useState(0);

  // function to insert markdown (toolbar actions)
  const handleInsertText = useCallback(
    (before: string, after: string = "") => {
      const textarea = document.querySelector(
        "textarea"
      ) as HTMLTextAreaElement;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = content.substring(start, end);
      const replacement = before + selectedText + after;

      const newContent =
        content.substring(0, start) + replacement + content.substring(end);
      setContent(newContent);

      // Reset cursor selection
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(
          start + before.length,
          start + before.length + selectedText.length
        );
      }, 0);
    },
    [content]
  );

  return (
    <div className="bg-muted h-full w-full rounded-xl border-none flex flex-col overflow-hidden">
      {/* Title: smaller height */}
      <div className="border-b rounded-t-xl flex-[2.5] border">
        <PostTitle />
      </div>

      {/* Toolbar: also small */}
      <div className="border-b flex-[0.5] border">
        <PostToolbar
          onInsertText={handleInsertText}
        />
      </div>

      {/* Resizable panels: take rest of the space */}
      <div className="flex-[7] rounded-b-xl border">
        <PostEditor
          content={content}
          setContent={setContent}
          onSelectionChange={(start, end) => {
            setSelectionStart(start);
            setSelectionEnd(end);
          }}
        />
      </div>
    </div>
  );
};

export default PostBox;
