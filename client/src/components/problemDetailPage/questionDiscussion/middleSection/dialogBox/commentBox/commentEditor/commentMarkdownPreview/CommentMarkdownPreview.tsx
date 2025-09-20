import React, { useEffect, useState } from "react";
import * as marked from "marked";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { createRoot } from "react-dom/client";

interface CommentMarkdownPreviewProps {
  markdown: string;
}

// Configure marked for better rendering
const configureMarked = () => {
  marked.use({
    renderer: {
      // Custom code block renderer with syntax highlighting
      code(token: any) {
        const code = token.text || "";
        const lang = token.lang || "text";

        const codeId = `code-${Math.random().toString(36).substr(2, 9)}`;

        return `
          <div class="code-block-container my-4 rounded-lg overflow-hidden border">
            <div class="bg-muted px-4 py-2 text-xs text-muted-foreground border-b flex justify-between items-center">
              <span>${lang}</span>
              <button class="hover:text-foreground transition-colors" onclick="navigator.clipboard.writeText(\`${code.replace(
                /`/g,
                "\\`"
              )}\`)">Copy</button>
            </div>
            <div id="${codeId}" data-code="${encodeURIComponent(
          code
        )}" data-lang="${lang}"></div>
          </div>
        `;
      },

      // Custom inline code renderer
      codespan(token: any) {
        const text = token.text || "";
        return `<code class="bg-muted px-2 py-1 rounded text-sm font-mono">${String(
          text
        )}</code>`;
      },

      // Custom heading renderer
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

      // Custom list renderer
      list(token: any) {
        const ordered = token.ordered || false;
        const tag = ordered ? "ol" : "ul";
        const className = ordered
          ? "list-decimal list-inside"
          : "list-disc list-inside";

        // Let marked handle the list items naturally
        let body = "";
        if (token.items && Array.isArray(token.items)) {
          body = token.items
            .map((item: any) => {
              const itemText = item.text || "";
              return `<li class="text-foreground">${String(itemText)}</li>`;
            })
            .join("");
        }

        return `<${tag} class="${className} my-4 space-y-2">${body}</${tag}>`;
      },

      listitem(token: any) {
        const text = token.text || "";
        return `<li class="text-foreground">${String(text)}</li>`;
      },

      // Custom blockquote renderer
      blockquote(token: any) {
        const quote = this.parser.parse(token.tokens || []);
        return `<blockquote class="border-l-4 border-primary pl-4 my-4 italic text-muted-foreground">${String(
          quote
        )}</blockquote>`;
      },

      // Custom link renderer
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

      // Custom image renderer
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

const CommentMarkdownPreview: React.FC<CommentMarkdownPreviewProps> = ({
  markdown,
}) => {
  const [htmlContent, setHtmlContent] = useState("");

  useEffect(() => {
    configureMarked();
  }, []);

  useEffect(() => {
    const getPreviewHTML = () => {
      try {
        const html = marked.parse(markdown);
        setHtmlContent(html);
      } catch (error) {
        console.error("Markdown parsing error:", error);
        setHtmlContent('<p class="text-red-400">Error parsing markdown</p>');
      }
    };

    getPreviewHTML();
  }, [markdown]);

  useEffect(() => {
    const codeBlocks = document.querySelectorAll('[id^="code-"]');
    codeBlocks.forEach((block) => {
      const code = decodeURIComponent(block.getAttribute("data-code") || "");
      const lang = block.getAttribute("data-lang") || "text";

      const root = createRoot(block);
      root.render(
        <SyntaxHighlighter
          language={lang}
          style={oneDark}
          customStyle={{
            margin: 0,
            padding: "1rem",
            background: "transparent",
            fontSize: "0.875rem",
          }}
        >
          {code}
        </SyntaxHighlighter>
      );
    });
  }, [htmlContent]);

  return (
    <div className="h-full w-full bg-background text-foreground p-2 overflow-y-auto text-lg">
      <div
        className="prose prose-invert max-w-none leading-relaxed"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    </div>
  );
};

export default CommentMarkdownPreview;
