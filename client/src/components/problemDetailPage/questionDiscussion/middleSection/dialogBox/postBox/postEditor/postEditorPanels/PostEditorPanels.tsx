import React from "react";
import PostMarkdownEditor from "../postMarkdownEditor/PostMarkdownEditor";
import PostMarkdownPreview from "../postMarkdownPreview/PostMarkdownPreview";
import { ScrollArea } from "@/components/ui/postTagsScrollArea";

type PostEditorLayoutProps = {
  content: string;
  setContent: (value: string) => void;
  onSelectionChange?: (start: number, end: number) => void;
};

const PostEditorLayout: React.FC<PostEditorLayoutProps> = ({
  content,
  setContent,
  onSelectionChange,
}) => {
  return (
    <div className="h-full w-full flex">
      {/* Left Panel (Editor) - Fixed 50% */}
      <div className="w-1/2 border mr-1 rounded-bl-xl overflow-hidden">
        <ScrollArea className="h-[458px] w-[720px]">
          <div className="h-[458px] w-[720px]">
            <PostMarkdownEditor
              content={content}
              setContent={setContent}
              onSelectionChange={onSelectionChange}
            />
          </div>
        </ScrollArea>
      </div>

      {/* Divider */}
      <div className="w-1 bg-border rounded-md my-1" />

      {/* Right Panel (Preview) - Fixed 50% */}
      <div className="w-1/2 border ml-1 rounded-br-xl overflow-hidden">
        <ScrollArea className="h-[457px] w-[720px]">
          <div className="h-[457px] w-[720px]">
            <PostMarkdownPreview markdown={content} />
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default PostEditorLayout;
