import React from "react";
import {
  Bold,
  Italic,
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
} from "lucide-react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

type CommentToolbarProps = {
  onInsertText: (before: string, after?: string) => void;
};

const CommentToolbar: React.FC<CommentToolbarProps> = ({ onInsertText }) => {
  const buttonClasses =
    "flex items-center justify-center rounded-lg p-1 border";

  const handleInsert = (before: string, after: string = "") => {
    console.log("Inserting:", { before, after });
    onInsertText(before, after);
  };

  return (
    <div className="flex flex-row items-center gap-2 ml-5 p-2">
      {/* Bold */}
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

      {/* Heading 1 */}
      <HoverCard>
        <HoverCardTrigger asChild>
          <button
            className={buttonClasses}
            onClick={() => handleInsert("# ", "")}
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
            onClick={() => handleInsert("## ", "")}
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
            onClick={() => handleInsert("### ", "")}
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
            onClick={() => handleInsert("* ", "")}
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
            onClick={() => handleInsert("1. ", "")}
          >
            <ListOrdered />
          </button>
        </HoverCardTrigger>
        <HoverCardContent side="top" className="p-1">
          Numbered List
        </HoverCardContent>
      </HoverCard>

      {/* Separator */}
      <div className="w-[3px] h-8 bg-border mx-1" />

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
            onClick={() => handleInsert("> ", "")}
          >
            <Quote />
          </button>
        </HoverCardTrigger>
        <HoverCardContent side="top" className="p-1">
          Quote
        </HoverCardContent>
      </HoverCard>

      {/* Link */}
      <HoverCard>
        <HoverCardTrigger asChild>
          <button
            className={buttonClasses}
            onClick={() => handleInsert("[", "](url)")}
          >
            <Link />
          </button>
        </HoverCardTrigger>
        <HoverCardContent side="top" className="p-1">
          Link
        </HoverCardContent>
      </HoverCard>

      {/* Image */}
      <HoverCard>
        <HoverCardTrigger asChild>
          <button
            className={buttonClasses}
            onClick={() => handleInsert("![alt](", ")")}
          >
            <Image />
          </button>
        </HoverCardTrigger>
        <HoverCardContent side="top" className="p-1">
          Image
        </HoverCardContent>
      </HoverCard>
    </div>
  );
};

export default CommentToolbar;
