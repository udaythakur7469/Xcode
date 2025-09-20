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

type CommentToolbarProps = {
  onInsertText: (before: string, after?: string) => void;
};

const CommentToolbar: React.FC<CommentToolbarProps> = ({ onInsertText }) => {
  const buttonClasses =
    "flex items-center justify-center rounded-lg p-1 border";

  // Debug function to check what's being passed
  const handleInsert = (before: string, after: string = "") => {
    console.log("Inserting:", { before, after });
    onInsertText(before, after);
  };

  return (
    <div className="flex flex-row items-center gap-2 ml-5 p-2">
      <button
        className={buttonClasses}
        onClick={() => handleInsert("**", "**")}
        title="Bold"
      >
        <Bold />
      </button>
      <button
        className={buttonClasses}
        onClick={() => handleInsert("*", "*")}
        title="Italic"
      >
        <Italic />
      </button>
      <button
        className={buttonClasses}
        onClick={() => handleInsert("# ", "")}
        title="H1"
      >
        <Heading1 />
      </button>
      <button
        className={buttonClasses}
        onClick={() => handleInsert("## ", "")}
        title="H2"
      >
        <Heading2 />
      </button>
      <button
        className={buttonClasses}
        onClick={() => handleInsert("### ", "")}
        title="Heading 3"
      >
        <Heading3 />
      </button>

      {/* Separator */}
      <div className="w-px h-6 bg-border mx-1"></div>

      <button
        className={buttonClasses}
        onClick={() => handleInsert("* ", "")}
        title="Bullet List"
      >
        <List />
      </button>
      <button
        className={buttonClasses}
        onClick={() => handleInsert("1. ", "")}
        title="Numbered List"
      >
        <ListOrdered />
      </button>

      {/* Separator */}
      <div className="w-px h-6 bg-border mx-1"></div>

      {/* Code */}
      <button
        className={buttonClasses}
        onClick={() => handleInsert("`", "`")}
        title="Inline Code"
      >
        <CodeXml />
      </button>

      <button
        className={buttonClasses}
        onClick={() => handleInsert("```\n", "\n```")}
        title="Code Block"
      >
        <FolderCode />
      </button>

      {/* Quote */}
      <button
        className={buttonClasses}
        onClick={() => handleInsert("> ", "")}
        title="Quote"
      >
        <Quote />
      </button>

      {/* Links and Images */}
      <button
        className={buttonClasses}
        onClick={() => handleInsert("[", "](url)")}
        title="Link"
      >
        <Link />
      </button>

      <button
        className={buttonClasses}
        onClick={() => handleInsert("![alt](", ")")}
        title="Image"
      >
        <Image />
      </button>
    </div>
  );
};

export default CommentToolbar;
