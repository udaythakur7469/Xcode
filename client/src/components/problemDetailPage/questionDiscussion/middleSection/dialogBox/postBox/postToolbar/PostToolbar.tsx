import React, { useRef, useState } from "react";
import {
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link,
  Image,
  CodeXml,
  FolderCode,
  Table,
  Minus,
  Lightbulb,
  History,
  Loader2,
  Sparkles,
} from "lucide-react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import MarkdownGuideDialog from "./postToolbarGuide/PostToolbarGuideDialog";
import { usePostEditorStore } from "@/features/postEditorStore";

type PostToolbarProps = {
  onInsertText: (before: string, after?: string) => void;
  onReset?: (() => void) | null;
  onOpenAIPanel: () => void;
  isAIPanelOpen: boolean;
};

const UPLOAD_PLACEHOLDER = "![uploading...]";

const TABLE_TEMPLATE = `| Column 1 | Column 2 | Column 3 |
| -------- | -------- | -------- |
| Cell     | Cell     | Cell     |
| Cell     | Cell     | Cell     |`;

const PostToolbar: React.FC<PostToolbarProps> = ({
  onInsertText,
  onReset,
  onOpenAIPanel,
  isAIPanelOpen,
}) => {
  const buttonClasses =
    "flex items-center justify-center rounded-lg p-1 border";

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isMarkdownGuideOpen, setIsMarkdownGuideOpen] = useState(false);
  const { uploadPostImage, isUploadingImage } = usePostEditorStore();

  const handleInsert = (before: string, after: string = "") => {
    onInsertText(before, after);
  };

  const handleImageButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = "";
    onInsertText(UPLOAD_PLACEHOLDER, "");
    try {
      const data = await uploadPostImage(file);
      const imageMarkdown = `![image](${data.url})`;
      const event = new CustomEvent("replaceMarkdownText", {
        detail: { find: UPLOAD_PLACEHOLDER, replace: imageMarkdown },
      });
      window.dispatchEvent(event);
    } catch (error) {
      console.error("Image upload failed:", error);
      const event = new CustomEvent("replaceMarkdownText", {
        detail: { find: UPLOAD_PLACEHOLDER, replace: "" },
      });
      window.dispatchEvent(event);
    } finally {
    }
  };

  return (
    <>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="flex flex-row items-center justify-between w-full px-5 py-2">
        {/* Left side - formatting buttons */}
        <div className="flex flex-row items-center gap-2">
          {/* Bold — wraps selection or inserts placeholder */}
          <HoverCard>
            <HoverCardTrigger asChild>
              <button
                className={buttonClasses}
                onClick={() => handleInsert("**", "**")}
              >
                <Bold />
              </button>
            </HoverCardTrigger>
            <HoverCardContent side="top" className="p-1">
              Bold
            </HoverCardContent>
          </HoverCard>

          {/* Italic */}
          <HoverCard>
            <HoverCardTrigger asChild>
              <button
                className={buttonClasses}
                onClick={() => handleInsert("*", "*")}
              >
                <Italic />
              </button>
            </HoverCardTrigger>
            <HoverCardContent side="top" className="p-1">
              Italic
            </HoverCardContent>
          </HoverCard>

          {/* Strikethrough */}
          <HoverCard>
            <HoverCardTrigger asChild>
              <button
                className={buttonClasses}
                onClick={() => handleInsert("~~", "~~")}
              >
                <Strikethrough />
              </button>
            </HoverCardTrigger>
            <HoverCardContent side="top" className="p-1">
              Strikethrough
            </HoverCardContent>
          </HoverCard>

          {/* Separator */}
          <div className="w-0.5 h-8 bg-border mx-1" />

          {/* Heading 1 */}
          <HoverCard>
            <HoverCardTrigger asChild>
              <button
                className={buttonClasses}
                onClick={() => handleInsert("# Heading 1", "")}
              >
                <Heading1 />
              </button>
            </HoverCardTrigger>
            <HoverCardContent side="top" className="p-1">
              Heading 1
            </HoverCardContent>
          </HoverCard>

          {/* Heading 2 */}
          <HoverCard>
            <HoverCardTrigger asChild>
              <button
                className={buttonClasses}
                onClick={() => handleInsert("## Heading 2", "")}
              >
                <Heading2 />
              </button>
            </HoverCardTrigger>
            <HoverCardContent side="top" className="p-1">
              Heading 2
            </HoverCardContent>
          </HoverCard>

          {/* Heading 3 */}
          <HoverCard>
            <HoverCardTrigger asChild>
              <button
                className={buttonClasses}
                onClick={() => handleInsert("### Heading 3", "")}
              >
                <Heading3 />
              </button>
            </HoverCardTrigger>
            <HoverCardContent side="top" className="p-1">
              Heading 3
            </HoverCardContent>
          </HoverCard>

          {/* Separator */}
          <div className="w-0.5 h-8 bg-border mx-1" />

          {/* Bullet List */}
          <HoverCard>
            <HoverCardTrigger asChild>
              <button
                className={buttonClasses}
                onClick={() => handleInsert("* List item", "")}
              >
                <List />
              </button>
            </HoverCardTrigger>
            <HoverCardContent side="top" className="p-1">
              Bullet List
            </HoverCardContent>
          </HoverCard>

          {/* Numbered List */}
          <HoverCard>
            <HoverCardTrigger asChild>
              <button
                className={buttonClasses}
                onClick={() => handleInsert("1. List item", "")}
              >
                <ListOrdered />
              </button>
            </HoverCardTrigger>
            <HoverCardContent side="top" className="p-1">
              Numbered List
            </HoverCardContent>
          </HoverCard>

          {/* Separator */}
          <div className="w-0.5 h-8 bg-border mx-1" />

          {/* Inline Code */}
          <HoverCard>
            <HoverCardTrigger asChild>
              <button
                className={buttonClasses}
                onClick={() => handleInsert("`", "`")}
              >
                <CodeXml />
              </button>
            </HoverCardTrigger>
            <HoverCardContent side="top" className="p-1">
              Inline Code
            </HoverCardContent>
          </HoverCard>

          {/* Code Block */}
          <HoverCard>
            <HoverCardTrigger asChild>
              <button
                className={buttonClasses}
                onClick={() => handleInsert("```\n", "\n```")}
              >
                <FolderCode />
              </button>
            </HoverCardTrigger>
            <HoverCardContent side="top" className="p-1">
              Code Block
            </HoverCardContent>
          </HoverCard>

          {/* Quote */}
          <HoverCard>
            <HoverCardTrigger asChild>
              <button
                className={buttonClasses}
                onClick={() => handleInsert("> Add quote", "")}
              >
                <Quote />
              </button>
            </HoverCardTrigger>
            <HoverCardContent side="top" className="p-1">
              Quote
            </HoverCardContent>
          </HoverCard>

          {/* Table */}
          <HoverCard>
            <HoverCardTrigger asChild>
              <button
                className={buttonClasses}
                onClick={() => handleInsert(TABLE_TEMPLATE, "")}
              >
                <Table />
              </button>
            </HoverCardTrigger>
            <HoverCardContent side="top" className="p-1">
              Table
            </HoverCardContent>
          </HoverCard>

          {/* Horizontal Rule */}
          <HoverCard>
            <HoverCardTrigger asChild>
              <button
                className={buttonClasses}
                onClick={() => handleInsert("\n---\n", "")}
              >
                <Minus />
              </button>
            </HoverCardTrigger>
            <HoverCardContent side="top" className="p-1">
              Horizontal Rule
            </HoverCardContent>
          </HoverCard>

          {/* Separator */}
          <div className="w-0.5 h-8 bg-border mx-1" />

          {/* Link */}
          <HoverCard>
            <HoverCardTrigger asChild>
              <button
                className={buttonClasses}
                onClick={() => handleInsert("[Link text](url)", "")}
              >
                <Link />
              </button>
            </HoverCardTrigger>
            <HoverCardContent side="top" className="p-1">
              Link
            </HoverCardContent>
          </HoverCard>

          {/* Image upload */}
          <HoverCard>
            <HoverCardTrigger asChild>
              <button
                className={buttonClasses}
                onClick={handleImageButtonClick}
                disabled={isUploadingImage}
              >
                {isUploadingImage ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <Image />
                )}
              </button>
            </HoverCardTrigger>
            <HoverCardContent side="top" className="p-1">
              {isUploadingImage ? "Uploading..." : "Upload Image"}
            </HoverCardContent>
          </HoverCard>

          {/* Separator */}
          <div className="w-0.5 h-8 bg-border mx-1" />

          {/* Write with AI */}
          <HoverCard>
            <HoverCardTrigger asChild>
              <button
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 border text-sm font-medium transition-colors ${
                  isAIPanelOpen
                    ? "border-violet-500 text-violet-500 bg-violet-50 dark:bg-violet-950/30"
                    : "border hover:bg-accent"
                }`}
                onClick={onOpenAIPanel}
              >
                <Sparkles size={16} />
                Write with AI
              </button>
            </HoverCardTrigger>
            <HoverCardContent side="top" className="p-1">
              Generate post with AI
            </HoverCardContent>
          </HoverCard>
        </div>

        {/* Right side */}

        {/* Right side */}
        <div className="flex items-center gap-2">
          <HoverCard>
            <HoverCardTrigger asChild>
              <button
                className={buttonClasses}
                onClick={() => setIsMarkdownGuideOpen(true)}
              >
                <Lightbulb />
              </button>
            </HoverCardTrigger>
            <HoverCardContent side="top" className="p-1">
              Markdown guide
            </HoverCardContent>
          </HoverCard>
          <HoverCard>
            <HoverCardTrigger asChild>
              <button
                className={buttonClasses}
                onClick={() => onReset?.()}
                disabled={!onReset}
              >
                <History />
              </button>
            </HoverCardTrigger>
            <HoverCardContent side="top" className="p-1 mr-8">
              Reset post
            </HoverCardContent>
          </HoverCard>
        </div>
      </div>

      <MarkdownGuideDialog
        isOpen={isMarkdownGuideOpen}
        onClose={() => setIsMarkdownGuideOpen(false)}
      />
    </>
  );
};

export default PostToolbar;
