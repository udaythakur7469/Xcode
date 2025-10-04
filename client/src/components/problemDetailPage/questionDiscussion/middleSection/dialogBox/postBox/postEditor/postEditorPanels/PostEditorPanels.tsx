import React, { useEffect, useState } from "react";
import PostMarkdownEditor from "../postMarkdownEditor/PostMarkdownEditor";
import PostMarkdownPreview from "../postMarkdownPreview/PostMarkdownPreview";
import { ScrollArea } from "@/components/ui/postTagsScrollArea";
import { usePostStore } from "@/features/postStore";
import { useSearchParams } from "next/navigation";
import { MoonLoader } from "react-spinners";

type PostEditorPanelsProps = {
  content: string;
  setContent: (value: string) => void;
  onSelectionChange?: (start: number, end: number) => void;
};

const PostEditorPanels: React.FC<PostEditorPanelsProps> = ({
  content,
  setContent,
  onSelectionChange,
}) => {
  const [problemTitle, setProblemTitle] = useState<string | null>(null);

  const {
    getPostBaseTemplate,
    isPostBaseTemplateLoading,
    postBaseTemplateError,
    postBaseTemplate,
  } = usePostStore();

  const searchParams = useSearchParams();

  // Effect to get problem title from URL params
  useEffect(() => {
    const title = searchParams.get("title");
    setProblemTitle(title);
  }, [searchParams]);

  // Effect to fetch template when problemTitle changes
  useEffect(() => {
    const fetchTemplate = async () => {
      if (!problemTitle) return;

      try {
        await getPostBaseTemplate(problemTitle);
      } catch (error) {
        console.error("Error fetching post template:", error);
      }
    };

    fetchTemplate();
  }, [problemTitle, getPostBaseTemplate]);

  // Effect to set content when template is available
  useEffect(() => {
    if (postBaseTemplate && content === "") {
      setContent(postBaseTemplate);
    }
  }, [postBaseTemplate, content, setContent]);

  // Loading state
  if (isPostBaseTemplateLoading && content === "") {
    return (
      <div className="h-full flex items-center justify-center">
        <MoonLoader color="#ffffff" size={100} />
      </div>
    );
  }

  // Error state
  if (postBaseTemplateError && content === "") {
    return (
      <div className="h-full flex items-center justify-center text-red-500 text-lg">
        {postBaseTemplateError}
      </div>
    );
  }

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

export default PostEditorPanels;
