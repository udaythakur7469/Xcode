import React, { useEffect } from "react";
import * as marked from "marked";

interface CommentMarkdownPreviewProps {
  markdown: string;
}

// ✅ Configure marked renderer
const configureMarked = () => {
  marked.use({
    renderer: {
      code(token: any) {
        const code = token.text || "";
        const lang = token.lang || "text";

        return `<div class="code-block-container my-4 rounded-lg overflow-hidden border">
          <div class="bg-muted px-4 py-2 text-xs text-muted-foreground border-b flex justify-between items-center">
            <span>${lang}</span>
            <button class="hover:text-foreground transition-colors" onclick="navigator.clipboard.writeText(\`${String(
              code || ""
            ).replace(/`/g, "\\`")}\`)">Copy</button>
          </div>
          <div class="bg-muted/30 p-4 overflow-x-auto text-foreground text-sm font-mono" style="white-space: pre; line-height: 1.4;">${String(
            code
          )}</div>
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
          "text-4xl",
          "text-3xl",
          "text-2xl",
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
    <div className="h-full w-full bg-background text-foreground p-2 overflow-auto text-lg">
      <div
        className="prose prose-invert max-w-none leading-relaxed prose-pre:p-0 prose-pre:m-0"
        dangerouslySetInnerHTML={getPreviewHTML()}
      />
    </div>
  );
};

export default CommentMarkdownPreview;
