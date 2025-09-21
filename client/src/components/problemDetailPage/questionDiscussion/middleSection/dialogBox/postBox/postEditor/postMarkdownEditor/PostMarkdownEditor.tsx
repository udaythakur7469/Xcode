import React, { useRef, useEffect, useState, useCallback } from "react";

interface PostMarkdownEditorProps {
  content: string;
  setContent: (value: string) => void;
  onSelectionChange?: (start: number, end: number) => void;
}

const PostMarkdownEditor: React.FC<PostMarkdownEditorProps> = ({
  content,
  setContent,
  onSelectionChange,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [lineNumbers, setLineNumbers] = useState<number[]>([]);

  // Update line numbers when content changes
  useEffect(() => {
    const lines = content.split("\n");
    setLineNumbers(Array.from({ length: lines.length }, (_, i) => i + 1));
  }, [content]);

  // Handle scroll synchronization
  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    const lineNumbersEl = e.currentTarget.parentElement?.querySelector(
      ".line-numbers"
    ) as HTMLElement;
    if (lineNumbersEl) {
      lineNumbersEl.scrollTop = e.currentTarget.scrollTop;
    }
  };

  // Track selection changes
  const handleSelection = useCallback(() => {
    if (textareaRef.current && onSelectionChange) {
      const { selectionStart, selectionEnd } = textareaRef.current;
      onSelectionChange(selectionStart, selectionEnd);
    }
  }, [onSelectionChange]);

  // Handle tab key for indentation and Enter for list continuation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;

      const newValue =
        content.substring(0, start) + "  " + content.substring(end);
      setContent(newValue);

      // Set cursor position after tab
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 2;
      }, 0);
    } else if (e.key === "Enter") {
      const target = e.currentTarget;
      const start = target.selectionStart;
      const currentLine = content.substring(0, start).split("\n").pop() || "";

      // Check if current line is a list item
      const bulletMatch = currentLine.match(/^(\s*)(\* )/);
      const numberedMatch = currentLine.match(/^(\s*)(\d+\. )/);

      if (bulletMatch) {
        e.preventDefault();
        const indent = bulletMatch[1];
        const newContent =
          content.substring(0, start) +
          "\n" +
          indent +
          "* " +
          content.substring(start);
        setContent(newContent);

        setTimeout(() => {
          target.selectionStart = target.selectionEnd =
            start + 1 + indent.length + 2;
        }, 0);
      } else if (numberedMatch) {
        e.preventDefault();
        const indent = numberedMatch[1];
        const currentNumber = parseInt(numberedMatch[2]);
        const nextNumber = currentNumber + 1;
        const newContent =
          content.substring(0, start) +
          "\n" +
          indent +
          nextNumber +
          ". " +
          content.substring(start);
        setContent(newContent);

        setTimeout(() => {
          target.selectionStart = target.selectionEnd =
            start + 1 + indent.length + String(nextNumber).length + 2;
        }, 0);
      }
    }
  };

  return (
    <div className="flex h-full w-full bg-background">
      {/* Line numbers */}
      <div className="line-numbers text-muted-foreground p-2 select-none bg-background border-r text-lg font-mono overflow-y-auto">
        {lineNumbers.map((n) => (
          <div key={n} className="leading-6 text-right min-w-[3ch]">
            {n}
          </div>
        ))}
      </div>

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onScroll={handleScroll}
        onSelect={handleSelection}
        onClick={handleSelection}
        onKeyUp={handleSelection}
        onKeyDown={handleKeyDown}
        className="flex-1 h-full w-full bg-background text-foreground font-mono text-lg p-2 outline-none leading-6 overflow-auto"
        style={{
          tabSize: 2,
          maxHeight: "calc(100vh - 120px)",
          maxWidth: "100%",
        }}
        spellCheck={true}
      />
    </div>
  );
};

export default PostMarkdownEditor;
