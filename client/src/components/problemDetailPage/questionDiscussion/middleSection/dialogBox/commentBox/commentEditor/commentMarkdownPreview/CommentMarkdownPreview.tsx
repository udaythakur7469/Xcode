import React, { useEffect } from "react";
import * as marked from "marked";

interface CommentMarkdownPreviewProps {
  markdown: string;
}

// ✅ Syntax highlighting function
const highlightCode = (code: string, language: string): string => {
  if (typeof code !== "string") {
    return String(code || "");
  }

  // Escape HTML to prevent conflicts
  let highlighted = code
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

  if (language === "cpp" || language === "c++" || language === "c") {
    // Keywords
    highlighted = highlighted.replace(
      /\b(class|public|private|protected|virtual|static|const|inline|template|typename|namespace|using|typedef|struct|enum)\b/g,
      '<span style="color:#60a5fa; font-weight:600;">$1</span>'
    );

    // Types
    highlighted = highlighted.replace(
      /\b(int|char|float|double|bool|void|string|vector|map|set|unordered_map|unordered_set|auto|size_t)\b/g,
      '<span style="color:#10b981; font-weight:600;">$1</span>'
    );

    // Control flow
    highlighted = highlighted.replace(
      /\b(if|else|for|while|do|switch|case|default|break|continue|return|try|catch|throw)\b/g,
      '<span style="color:#a78bfa; font-weight:600;">$1</span>'
    );

    // Comments
    highlighted = highlighted.replace(
      /(\/\/.*$)/gm,
      '<span style="color:#6b7280; font-style:italic;">$1</span>'
    );

    // Numbers
    highlighted = highlighted.replace(
      /\b\d+\b/g,
      '<span style="color:#fbbf24;">$&</span>'
    );
  }

  if (language === "javascript" || language === "js") {
    // Keywords
    highlighted = highlighted.replace(
      /\b(const|let|var|function|class|if|else|for|while|return|import|export|default|async|await)\b/g,
      '<span style="color:#60a5fa; font-weight:600;">$1</span>'
    );

    // Comments
    highlighted = highlighted.replace(
      /(\/\/.*$)/gm,
      '<span style="color:#6b7280; font-style:italic;">$1</span>'
    );

    // Numbers
    highlighted = highlighted.replace(
      /\b\d+\b/g,
      '<span style="color:#fbbf24;">$&</span>'
    );
  }

  return highlighted;
};

// ✅ Configure marked renderer
const configureMarked = () => {
  marked.use({
    renderer: {
      code(token: any) {
        const code = token.text || "";
        const lang = token.lang || "text";

        let highlighted;
        try {
          highlighted = highlightCode(code, lang);
        } catch (error) {
          console.warn("Error highlighting code:", error);
          highlighted = String(code);
        }

        return `<div class="code-block-container my-4 rounded-lg overflow-hidden border">
          <div class="bg-muted px-4 py-2 text-xs text-muted-foreground border-b flex justify-between items-center">
            <span>${lang}</span>
            <button class="hover:text-foreground transition-colors" onclick="navigator.clipboard.writeText(\`${String(
              code || ""
            ).replace(/`/g, "\\`")}\`)">Copy</button>
          </div>
          <div class="bg-muted/30 p-4 overflow-x-auto text-foreground text-sm font-mono" style="white-space: pre; line-height: 1.4;">${highlighted}</div>
        </div>`;
      },

      codespan(token: any) {
        const text = token.text || "";
        return `<code class="bg-muted px-2 py-1 rounded text-sm font-mono">${String(
          text
        )}</code>`;
      },

      heading(token: any) {
        const text = token.text || "";
        const level = token.depth || 1;
        const sizes = [
          "text-3xl",
          "text-2xl",
          "text-xl",
          "text-lg",
          "text-base",
          "text-sm",
        ];
        const size = sizes[level - 1] || "text-base";
        return `<h${level} class="${size} font-bold text-foreground mt-1 mb-1">${String(
          text
        )}</h${level}>`;
      },

      list(token: any) {
        const ordered = token.ordered || false;
        const tag = ordered ? "ol" : "ul";
        const className = ordered
          ? "list-decimal list-inside"
          : "list-disc list-inside";

        let body = "";
        if (token.items && Array.isArray(token.items)) {
          body = token.items
            .map((item: any) => {
              const itemText = item.text || "";
              return `<li class="text-foreground">${String(itemText)}</li>`;
            })
            .join("");
        }

        return `<${tag} class="${className} ">${body}</${tag}>`;
      },

      listitem(token: any) {
        const text = token.text || "";
        return `<li class="text-foreground">${String(text)}</li>`;
      },

      blockquote(token: any) {
        const quote = this.parser.parse(token.tokens || []);
        return `<blockquote class="border-l-4 border-primary pl-4 my-4 italic text-muted-foreground">${String(
          quote
        )}</blockquote>`;
      },

      link(token: any) {
        const href = token.href || "#";
        const title = token.title || "";
        const text = token.text || "";
        return `<a href="${String(href)}" title="${String(
          title
        )}" target="_blank" rel="noopener noreferrer" class="text-primary underline hover:text-primary/80">${String(
          text
        )}</a>`;
      },

      image(token: any) {
        const href = token.href || "";
        const title = token.title || "";
        const text = token.text || "Image";
        return `<img src="${String(href)}" alt="${String(
          text
        )}" title="${String(
          title
        )}" class="max-w-full h-auto my-4 rounded border">`;
      },
    },
    gfm: true,
    breaks: true,
  });
};

// ✅ Main component
const CommentMarkdownPreview: React.FC<CommentMarkdownPreviewProps> = ({
  markdown,
}) => {
  useEffect(() => {
    configureMarked();
  }, []);

  const getPreviewHTML = () => {
    try {
      const html = marked.parse(markdown);
      return { __html: html }; // ✅ Fixed: Use __html instead of html
    } catch (error) {
      console.error("Markdown parsing error:", error);
      return { __html: '<p class="text-red-400">Error parsing markdown</p>' }; // ✅ Fixed: Use __html
    }
  };

  return (
    <div className="h-full w-full bg-background text-foreground p-2 overflow-y-auto text-lg">
      <div
        className="prose prose-invert max-w-none leading-relaxed prose-pre:p-0 prose-pre:m-0"
        dangerouslySetInnerHTML={getPreviewHTML()}
      />
    </div>
  );
};

export default CommentMarkdownPreview;
