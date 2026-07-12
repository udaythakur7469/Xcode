import React, { useRef, useEffect, useState, useCallback } from "react";

interface PostMarkdownEditorProps {
  content: string;
  setContent: (value: string) => void;
  onSelectionChange?: (start: number, end: number) => void;
  onReset?: () => void;
}

const PostMarkdownEditor: React.FC<PostMarkdownEditorProps> = ({
  content,
  setContent,
  onSelectionChange,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [lineNumbers, setLineNumbers] = useState<number[]>([]);

  useEffect(() => {
    const lines = content.split("\n");
    setLineNumbers(Array.from({ length: lines.length }, (_, i) => i + 1));
  }, [content]);

  useEffect(() => {
    const handleReplace = (e: Event) => {
      const { find, replace } = (
        e as CustomEvent<{ find: string; replace: string }>
      ).detail;
      setContent(content.replace(find, replace));
    };
    window.addEventListener("replaceMarkdownText", handleReplace);
    return () =>
      window.removeEventListener("replaceMarkdownText", handleReplace);
  }, [content, setContent]);

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    const lineNumbersEl = e.currentTarget.parentElement?.querySelector(
      ".line-numbers",
    ) as HTMLElement;
    if (lineNumbersEl) {
      lineNumbersEl.scrollTop = e.currentTarget.scrollTop;
    }
  };

  const handleSelection = useCallback(() => {
    if (textareaRef.current && onSelectionChange) {
      const { selectionStart, selectionEnd } = textareaRef.current;
      onSelectionChange(selectionStart, selectionEnd);
    }
  }, [onSelectionChange]);

  // Returns the indent size to use for the current line.
  // Numbered list lines need 3 spaces (to clear "1. " marker width).
  // Everything else uses 2 spaces.
  const getIndentSize = (lineContent: string): number => {
    return /^\s*\d+\.\s/.test(lineContent) ? 3 : 2;
  };

  // Returns how many leading spaces to remove on Shift+Tab.
  // Checks for 3-space then 2-space then 1-space indent.
  const getOutdentSize = (lineContent: string): number => {
    if (lineContent.startsWith("   ")) return 3;
    if (lineContent.startsWith("  ")) return 2;
    if (lineContent.startsWith(" ")) return 1;
    return 0;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    window.dispatchEvent(new CustomEvent("editorTyping"));
    const target = e.currentTarget;
    const start = target.selectionStart;
    const end = target.selectionEnd;
    const lineStart = content.lastIndexOf("\n", start - 1) + 1;
    const lineContent = content.substring(lineStart);

    // ── Tab: indent current line ──────────────────────────────────────────
    if (e.key === "Tab" && !e.shiftKey) {
      e.preventDefault();

      const spaces = " ".repeat(getIndentSize(lineContent));
      const newContent =
        content.substring(0, lineStart) + spaces + content.substring(lineStart);

      setContent(newContent);
      setTimeout(() => {
        target.selectionStart = start + spaces.length;
        target.selectionEnd = end + spaces.length;
      }, 0);
      return;
    }

    // ── Shift+Tab: outdent current line ───────────────────────────────────
    if (e.key === "Tab" && e.shiftKey) {
      e.preventDefault();

      const spacesToRemove = getOutdentSize(lineContent);
      if (spacesToRemove === 0) return;

      const newContent =
        content.substring(0, lineStart) +
        content.substring(lineStart + spacesToRemove);

      setContent(newContent);
      setTimeout(() => {
        target.selectionStart = Math.max(lineStart, start - spacesToRemove);
        target.selectionEnd = Math.max(lineStart, end - spacesToRemove);
      }, 0);
      return;
    }

    // ── Enter: smart list continuation ────────────────────────────────────
    if (e.key === "Enter") {
      const currentLine = content.substring(0, start).split("\n").pop() || "";

      const bulletMatch = currentLine.match(/^(\s*)(\* )(.*)/);
      const numberedMatch = currentLine.match(/^(\s*)(\d+)\. (.*)/);

      if (bulletMatch) {
        const indent = bulletMatch[1];
        const itemText = bulletMatch[3];

        if (!itemText.trim()) {
          e.preventDefault();
          const newContent =
            content.substring(0, lineStart) + "\n" + content.substring(start);
          setContent(newContent);
          setTimeout(() => {
            target.selectionStart = target.selectionEnd = lineStart + 1;
          }, 0);
          return;
        }

        e.preventDefault();
        const continuation = "\n" + indent + "* ";
        const newContent =
          content.substring(0, start) + continuation + content.substring(start);
        setContent(newContent);
        setTimeout(() => {
          target.selectionStart = target.selectionEnd =
            start + continuation.length;
        }, 0);
        return;
      }

      if (numberedMatch) {
        const indent = numberedMatch[1];
        const currentNumber = parseInt(numberedMatch[2]);
        const itemText = numberedMatch[3];

        if (!itemText.trim()) {
          e.preventDefault();
          const newContent =
            content.substring(0, lineStart) + "\n" + content.substring(start);
          setContent(newContent);
          setTimeout(() => {
            target.selectionStart = target.selectionEnd = lineStart + 1;
          }, 0);
          return;
        }

        e.preventDefault();
        const continuation = "\n" + indent + (currentNumber + 1) + ". ";
        const newContent =
          content.substring(0, start) + continuation + content.substring(start);
        setContent(newContent);
        setTimeout(() => {
          target.selectionStart = target.selectionEnd =
            start + continuation.length;
        }, 0);
        return;
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
        id="post-markdown-editor"
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onScroll={handleScroll}
        onSelect={handleSelection}
        onClick={handleSelection}
        onKeyUp={handleSelection}
        onKeyDown={handleKeyDown}
        className="flex-1 h-full w-full bg-background text-foreground font-mono text-lg pl-3 pr-2 pt-2 outline-none leading-6 resize-none overflow-auto"
        style={{
          tabSize: 2,
          maxWidth: "100%",
          wordWrap: "break-word",
          overflowWrap: "break-word",
          whiteSpace: "pre-wrap",
        }}
        spellCheck={true}
      />
    </div>
  );
};

export default PostMarkdownEditor;
