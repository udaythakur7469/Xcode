/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect } from "react";
import * as marked from "marked";
import hljs from "highlight.js";
import "highlight.js/styles/github-dark.min.css";
import PostDataComments from "./PostDataComments";

// Minimal HTML escaper for fallback paths
const escapeHtml = (raw: string): string =>
  raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

interface PostDataContentProps {
  markdown: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const renderListItem = (item: any, parser: any): string => {
  let html = "";
  for (const token of item.tokens || []) {
    if (token.type === "list") {
      html += renderList(token, parser);
    } else if (token.type === "text") {
      if (token.tokens && token.tokens.length > 0) {
        html += parser.parseInline(token.tokens);
      } else {
        html += escapeHtml(token.text || "");
      }
    } else {
      html += parser.parseInline([token]);
    }
  }
  return html;
};

const renderList = (token: any, parser: any): string => {
  const ordered = token.ordered || false;
  const tag = ordered ? "ol" : "ul";
  const className = ordered
    ? "list-decimal list-outside ml-5 my-1"
    : "list-disc list-outside ml-5 my-1";

  const body = (token.items || [])
    .map((item: any) => {
      const inner = renderListItem(item, parser);
      return `<li class="text-foreground my-0.5">${inner}</li>`;
    })
    .join("");

  return `<${tag} class="${className}">${body}</${tag}>`;
};

// ─── Renderer config ─────────────────────────────────────────────────────────

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
    <div class="bg-muted px-4 py-3 text-xs text-muted-foreground border-b flex justify-between items-center">
      <span>${lang}</span>
      <button class="hover:text-foreground transition-colors copy-btn" onclick="copyCodeToClipboard(this, \`${String(
        code || "",
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
        return `<h${level} class="${size} font-bold text-foreground mt-1 mb-1">${String(text)}</h${level}>`;
      },

      list(token: any) {
        return renderList(token, this.parser);
      },

      listitem(token: any) {
        const inner = renderListItem(token, this.parser);
        return `<li class="text-foreground my-0.5">${inner}</li>`;
      },

      table(token: any) {
        const headerCells = (token.header || [])
          .map((cell: any) => {
            const text = this.parser.parseInline(cell.tokens || []);
            const align = cell.align ? `text-${cell.align}` : "text-left";
            return `<th class="px-4 py-2 border border-border font-semibold text-foreground ${align}">${String(text)}</th>`;
          })
          .join("");

        const bodyRows = (token.rows || [])
          .map((row: any) => {
            const cells = row
              .map((cell: any) => {
                const text = this.parser.parseInline(cell.tokens || []);
                const align = cell.align ? `text-${cell.align}` : "text-left";
                return `<td class="px-4 py-2 border border-border text-muted-foreground ${align}">${String(text)}</td>`;
              })
              .join("");
            return `<tr class="even:bg-muted/30">${cells}</tr>`;
          })
          .join("");

        return `<div class="overflow-x-auto my-4">
  <table class="w-full border-collapse border border-border text-sm rounded-lg overflow-hidden">
    <thead class="bg-muted">
      <tr>${headerCells}</tr>
    </thead>
    <tbody>${bodyRows}</tbody>
  </table>
</div>`;
      },

      blockquote(token: any) {
        const quote = this.parser.parse(token.tokens || []);
        return `<blockquote class="border-l-4 border-primary pl-4 my-4 italic text-muted-foreground">${String(quote)}</blockquote>`;
      },

      link(token: any) {
        const href = token.href || "#";
        const title = token.title || "";
        const text = this.parser.parseInline(token.tokens || []);
        return `<a href="${String(href)}" title="${String(title)}" target="_blank" rel="noopener noreferrer" class="text-primary underline hover:text-primary/80">${String(text)}</a>`;
      },

      image(token: any) {
        const href = token.href || "";
        const title = token.title || "";
        const text = token.text || "Image";
        return `<img src="${String(href)}" alt="${String(text)}" title="${String(title)}" class="max-w-full h-auto my-4 rounded border">`;
      },

      paragraph(token: any) {
        const text = this.parser.parseInline(token.tokens || []);
        return `<p class="my-2">${String(text)}</p>`;
      },

      hr() {
        return `<hr class="my-6 border-border" />`;
      },
    },
    gfm: true,
    breaks: true,
  });
};

// ✅ Module-level call — renderer is ready before first render
configureMarked();

// ✅ Every blank line → &nbsp; for consistent visible spacing
const preprocessMarkdown = (markdown: string): string => {
  let inCodeBlock = false;
  const lines = markdown.split("\n");
  const result: string[] = [];

  for (const line of lines) {
    if (line.trim().startsWith("```")) {
      inCodeBlock = !inCodeBlock;
      result.push(line);
      continue;
    }
    if (inCodeBlock) {
      result.push(line);
      continue;
    }
    result.push(line.trim() === "" ? "&nbsp;" : line);
  }

  return result.join("\n");
};

// ─── Component ───────────────────────────────────────────────────────────────

const PostDataContent: React.FC<PostDataContentProps> = ({ markdown }) => {
  useEffect(() => {
    (window as any).copyCodeToClipboard = async (
      button: HTMLButtonElement,
      text: string,
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
      const processedMarkdown = preprocessMarkdown(markdown);
      const html = marked.parse(processedMarkdown);
      return { __html: html };
    } catch (error) {
      console.error("Markdown parsing error:", error);
      return { __html: '<p class="text-red-400">Error parsing markdown</p>' };
    }
  };

  return (
    /*
      ✅ No h-full, no overflow-auto here.
      This component just renders its content and grows naturally.
      Scrolling is handled entirely by FullPostPanel's scroll container.
    */
    <div className="w-full bg-background text-foreground text-lg">
      <div
        className="prose prose-invert max-w-none prose-pre:p-0 prose-pre:m-0 leading-6 pl-3 pr-2 pt-0 break-words text-lg font-sans"
        style={{
          wordWrap: "break-word",
          overflowWrap: "break-word",
          maxWidth: "100%",
          // @ts-expect-error: inline CSS custom property for potential theme overrides
          "--hljs-bg": "transparent",
        }}
        dangerouslySetInnerHTML={getPreviewHTML()}
      />
      <div className="mb-8 pl-3 pr-2 pt-0 pb-3">
        <PostDataComments />
      </div>
    </div>
  );
};

export default PostDataContent;
