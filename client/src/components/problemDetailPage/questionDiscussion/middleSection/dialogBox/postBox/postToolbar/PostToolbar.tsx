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
} from "lucide-react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import MarkdownGuideDialog from "./markdownGuide/MarkdownGuideDialog";

type PostToolbarProps = {
  onInsertText: (before: string, after?: string) => void;
  onReset?: (() => void) | null;
};

const UPLOAD_PLACEHOLDER = "![uploading...](placeholder)";

const TABLE_TEMPLATE = `| Column 1 | Column 2 | Column 3 |
| -------- | -------- | -------- |
| Cell     | Cell     | Cell     |
| Cell     | Cell     | Cell     |`;

const PostToolbar: React.FC<PostToolbarProps> = ({ onInsertText, onReset }) => {
  const buttonClasses =
    "flex items-center justify-center rounded-lg p-1 border";

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isMarkdownGuideOpen, setIsMarkdownGuideOpen] = useState(false);

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
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/post/upload-image", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Upload failed");
      }

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
      setIsUploading(false);
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
                disabled={isUploading}
              >
                {isUploading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <Image />
                )}
              </button>
            </HoverCardTrigger>
            <HoverCardContent side="top" className="p-1">
              {isUploading ? "Uploading..." : "Upload Image"}
            </HoverCardContent>
          </HoverCard>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
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
            <HoverCardContent side="left" className="p-1">
              Reset post
            </HoverCardContent>
          </HoverCard>

          <HoverCard>
            <HoverCardTrigger asChild>
              <button
                className={buttonClasses}
                onClick={() => setIsMarkdownGuideOpen(true)}
              >
                <Lightbulb />
              </button>
            </HoverCardTrigger>
            <HoverCardContent side="top" className="p-1 mr-10">
              Markdown guide
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
