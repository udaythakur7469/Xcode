/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect } from "react";
import * as marked from "marked";
import hljs from "highlight.js";
import "highlight.js/styles/github-dark.min.css";

// Minimal HTML escaper for fallback paths
const escapeHtml = (raw: string): string =>
  raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

interface PostMarkdownPreviewProps {
  markdown: string;
}

// ✅ Configure marked renderer
const configureMarked = () => {
  marked.use({
    renderer: {
      code(token: any) {
        const code = token.text || "";
        const lang = token.lang || "text";

        let highlighted = "";
        try {
          if (lang && hljs.getLanguage(lang)) {
            highlighted = hljs.highlight(code, { language: lang }).value;
          } else {
            highlighted = hljs.highlightAuto(code).value;
          }
        } catch {
          highlighted = escapeHtml(code);
        }

        return `<div class="code-block-container my-4 rounded-lg border" style="width: 700px; max-width: 100%; overflow: hidden;">
    <div class="bg-muted px-4 py-2 text-xs text-muted-foreground border-b flex justify-between items-center">
      <span>${lang}</span>
      <button class="hover:text-foreground transition-colors copy-btn" onclick="copyCodeToClipboard(this, \`${String(
        code || ""
      ).replace(/`/g, "\\`")}\`)">
        <svg class="copy-icon w-4 h-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
          <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
        </svg>
        <svg class="check-icon w-4 h-4 hidden" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 6 9 17l-5-5"/>
        </svg>
      </button>
    </div>
    <pre class="p-0 text-foreground text-sm"><code class="hljs ${
      lang ? `language-${lang}` : ""
    }" style="white-space: pre-wrap; line-height: 1.4; word-break: break-all; overflow-wrap: anywhere; width: 100%;">${highlighted}</code></pre>
  </div>`;
      },

      codespan(token: any) {
        const text = token.text || "";
        let highlighted = "";
        try {
          // Inline code usually lacks language hints; use auto highlighting
          highlighted = hljs.highlightAuto(text).value;
        } catch {
          highlighted = escapeHtml(text);
        }
        return `<code class="hljs px-2 py-1 rounded text-sm font-mono">${highlighted}</code>`;
      },

      heading(token: any) {
        const text = this.parser.parseInline(token.tokens || []);
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
              // Parse item tokens to support inline markdown inside list items
              const itemHtml = this.parser.parseInline(item.tokens || []);
              return `<li class="text-foreground">${String(itemHtml)}</li>`;
            })
            .join("");
        }

        return `<${tag} class="${className} ">${body}</${tag}>`;
      },

      listitem(token: any) {
        const text = this.parser.parseInline(token.tokens || []);
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
        const text = this.parser.parseInline(token.tokens || []);
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

      paragraph(token: any) {
        const text = this.parser.parseInline(token.tokens || []);
        return `<p class="my-2">${String(text)}</p>`;
      },
    },
    gfm: true,
    breaks: true,
  });
};

// ✅ Preprocess markdown to preserve extra blank lines (with a bit more space)
const preprocessMarkdown = (markdown: string): string => {
  let inCodeBlock = false;
  let consecutiveBlankLines = 0;
  const lines = markdown.split("\n");
  const result: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Toggle code block state on fenced lines
    if (line.trim().startsWith("```")) {
      inCodeBlock = !inCodeBlock;
      consecutiveBlankLines = 0;
      result.push(line);
      continue;
    }

    if (inCodeBlock) {
      result.push(line);
      continue;
    }

    if (line.trim() === "") {
      // Special-case: a single blank line at the very start of the document
      if (i === 0) {
        result.push("&nbsp;");
        consecutiveBlankLines = 1;
        continue;
      }
      consecutiveBlankLines += 1;
      // Keep the first blank line as real blank (paragraph break)
      if (consecutiveBlankLines === 1) {
        result.push("");
      } else {
        // For each extra blank line, insert a non-breaking space line.
        // This creates visual spacing without triggering HTML block parsing in marked.
        result.push("&nbsp;");
      }
      continue;
    }

    // Non-empty line resets the counter
    consecutiveBlankLines = 0;
    result.push(line);
  }

  return result.join("\n");
};

// ✅ Main component
const PostMarkdownPreview: React.FC<PostMarkdownPreviewProps> = ({
  markdown,
}) => {
  useEffect(() => {
    configureMarked();

    // Add global copy function
    (window as any).copyCodeToClipboard = async (
      button: HTMLButtonElement,
      text: string
    ) => {
      try {
        await navigator.clipboard.writeText(text);
        const copyIcon = button.querySelector(".copy-icon");
        const checkIcon = button.querySelector(".check-icon");

        copyIcon?.classList.add("hidden");
        checkIcon?.classList.remove("hidden");

        setTimeout(() => {
          copyIcon?.classList.remove("hidden");
          checkIcon?.classList.add("hidden");
        }, 2000);
      } catch (err) {
        console.error("Failed to copy text: ", err);
      }
    };
  }, []);

  const getPreviewHTML = () => {
    try {
      // Preprocess markdown to preserve extra blank lines
      const processedMarkdown = preprocessMarkdown(markdown);
      const html = marked.parse(processedMarkdown);
      return { __html: html };
    } catch (error) {
      console.error("Markdown parsing error:", error);
      return { __html: '<p class="text-red-400">Error parsing markdown</p>' };
    }
  };

  return (
    <div className="h-full w-full bg-background text-foreground overflow-auto text-lg">
      <div
        className="prose prose-invert max-w-none prose-pre:p-0 prose-pre:m-0 leading-6 pl-3 pr-2 pt-0 break-words text-lg font-mono"
        style={{
          wordWrap: "break-word",
          overflowWrap: "break-word",
          maxWidth: "100%",
          // Ensure theme backgrounds never bleed through
          // (Highlight.js themes sometimes set a background on .hljs)
          // We keep it transparent here across the preview container
          // and override common selectors via inline style scope
          // without needing global CSS.
          // @ts-expect-error: inline CSS custom property for potential theme overrides
          "--hljs-bg": "transparent",
        }}
        dangerouslySetInnerHTML={getPreviewHTML()}
      />
    </div>
  );
};

export default PostMarkdownPreview;
