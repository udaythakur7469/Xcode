import React, { useEffect, useState, useRef } from "react";
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
  onResetReady?: () => void;
  setOriginalTemplate?: (template: string) => void;
  hasChanges?: boolean;
};

const PostEditorPanels: React.FC<PostEditorPanelsProps> = ({
  content,
  setContent,
  onSelectionChange,
  onResetReady,
  setOriginalTemplate,
  hasChanges,
}) => {
  const [problemTitle, setProblemTitle] = useState<string | null>(null);
  const hasLoadedInitialContent = useRef(false);
  const originalTemplateRef = useRef<string>("");

  const {
    getPostBaseTemplate,
    isPostBaseTemplateLoading,
    postBaseTemplateError,
    postBaseTemplate,
  } = usePostStore();

  const searchParams = useSearchParams();

  // Effect to get problem title and load template once
  useEffect(() => {
    const title = searchParams.get("title");
    setProblemTitle(title);

    const loadTemplate = async () => {
      if (!title || hasLoadedInitialContent.current) return;

      try {
        await getPostBaseTemplate(title);
      } catch (error) {
        console.error("Error fetching post template:", error);
      }
    };

    loadTemplate();
  }, [searchParams, getPostBaseTemplate]);

  // Effect to set initial content once
  useEffect(() => {
    if (
      postBaseTemplate &&
      !hasLoadedInitialContent.current &&
      content === ""
    ) {
      setContent(postBaseTemplate);
      originalTemplateRef.current = postBaseTemplate;
      // Send original template to parent
      if (setOriginalTemplate) {
        setOriginalTemplate(postBaseTemplate);
      }
      hasLoadedInitialContent.current = true;
    }
  }, [postBaseTemplate, content, setContent, setOriginalTemplate]);

  const handleReset = () => {
    if (postBaseTemplate) {
      setContent(postBaseTemplate);
      // Notify parent about reset
      if (setOriginalTemplate) {
        setOriginalTemplate(postBaseTemplate);
      }
      console.log("🔄 Content reset to original template");
    }
  };

  useEffect(() => {
    if (onResetReady && originalTemplateRef.current) {
      onResetReady(() => handleReset);
    }
  }, [onResetReady, originalTemplateRef.current]);

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
              onReset={handleReset}
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
