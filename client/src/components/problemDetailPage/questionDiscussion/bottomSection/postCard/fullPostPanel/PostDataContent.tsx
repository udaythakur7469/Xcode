/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect } from "react";
import * as marked from "marked";
import hljs from "highlight.js";
import "highlight.js/styles/github-dark.min.css";
import PostDataComments from "./PostDataComments";

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

// ─── List helpers ────────────────────────────────────────────────────────────
// All list styles use inline style — prose resets list-style/margin/padding
// to 0 on ol/ul so Tailwind classes like ml-5 get wiped out.

const renderListItem = (item: any, parser: any): string => {
  let html = "";
  for (const token of item.tokens || []) {
    if (token.type === "list") {
      html += renderList(token, parser);
    } else if (token.type === "text") {
      html += token.tokens?.length
        ? parser.parseInline(token.tokens)
        : escapeHtml(token.text || "");
    } else {
      html += parser.parseInline([token]);
    }
  }
  return html;
};

const renderList = (token: any, parser: any): string => {
  const ordered = token.ordered || false;
  const tag = ordered ? "ol" : "ul";
  const listStyle = ordered ? "decimal" : "disc";
  const body = (token.items || [])
    .map((item: any) => {
      const inner = renderListItem(item, parser);
      return `<li style="display: list-item; margin: 2px 0;">${inner}</li>`;
    })
    .join("");
  return `<${tag} style="list-style-type: ${listStyle}; list-style-position: outside; margin: 4px 0 4px 20px; padding: 0;">${body}</${tag}>`;
};

// ─── Renderer ────────────────────────────────────────────────────────────────

const configureMarked = () => {
  marked.use({
    renderer: {
      code(token: any) {
        const code = token.text || "";
        const lang = token.lang || "text";
        let highlighted = "";
        try {
          highlighted =
            lang && hljs.getLanguage(lang)
              ? hljs.highlight(code, { language: lang }).value
              : hljs.highlightAuto(code).value;
        } catch {
          highlighted = escapeHtml(code);
        }
        return `<div class="code-block-container my-4 rounded-lg border" style="width: 700px; max-width: 100%; overflow: hidden;">
    <div class="bg-muted px-4 py-3 text-xs text-muted-foreground border-b flex justify-between items-center">
      <span>${lang}</span>
      <button class="hover:text-foreground transition-colors copy-btn" onclick="copyCodeToClipboard(this, \`${String(code || "").replace(/`/g, "\\`")}\`)">
        <svg class="copy-icon w-4 h-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
          <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
        </svg>
        <svg class="check-icon w-4 h-4 hidden" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 6 9 17l-5-5"/>
        </svg>
      </button>
    </div>
    <pre class="p-0 text-foreground text-sm"><code class="hljs ${lang ? `language-${lang}` : ""}" style="white-space: pre-wrap; line-height: 1.4; word-break: break-all; overflow-wrap: anywhere; width: 100%;">${highlighted}</code></pre>
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
        return `<h${level} class="${sizes[level - 1] || "text-base"} font-bold text-foreground mt-1 mb-1">${String(text)}</h${level}>`;
      },

      list(token: any) {
        return renderList(token, this.parser);
      },
      listitem(token: any) {
        const inner = renderListItem(token, this.parser);
        return `<li style="display: list-item; margin: 2px 0;">${inner}</li>`;
      },

      table(token: any) {
        const borderStyle = "border: 1px solid rgba(128,128,128,0.4);";
        const headerCells = (token.header || [])
          .map((cell: any) => {
            const text = this.parser.parseInline(cell.tokens || []);
            const align = cell.align ? `text-align: ${cell.align};` : "";
            return `<th class="font-semibold text-foreground" style="${borderStyle} ${align} padding: 8px 16px;">${String(text)}</th>`;
          })
          .join("");

        const bodyRows = (token.rows || [])
          .map((row: any, rowIndex: number) => {
            const bg =
              rowIndex % 2 === 1 ? "background: rgba(128,128,128,0.08);" : "";
            const cells = row
              .map((cell: any) => {
                const text = this.parser.parseInline(cell.tokens || []);
                const align = cell.align ? `text-align: ${cell.align};` : "";
                return `<td class="text-muted-foreground" style="${borderStyle} ${align} padding: 8px 16px;">${String(text)}</td>`;
              })
              .join("");
            return `<tr style="${bg}">${cells}</tr>`;
          })
          .join("");

        return `<div class="overflow-x-auto my-4">
  <table class="w-full text-sm" style="border-spacing: 0; border: 2px solid rgba(128,128,128,0.4); border-radius: 8px; overflow: hidden;">
    <thead style="background: rgba(128,128,128,0.15);"><tr>${headerCells}</tr></thead>
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
        return `<img src="${String(token.href || "")}" alt="${String(token.text || "Image")}" title="${String(token.title || "")}" class="max-w-full h-auto my-4 rounded border">`;
      },

      paragraph(token: any) {
        const text = this.parser.parseInline(token.tokens || []);
        return `<p class="my-2">${String(text)}</p>`;
      },

      hr() {
        return `<hr class="my-6 border-border" />`;
      },

      del(token: any) {
        const text = this.parser.parseInline(token.tokens || []);
        return `<del style="text-decoration-line: line-through; text-decoration-thickness: 2px; text-decoration-color: currentColor;">${String(text)}</del>`;
      },
    },
    gfm: true,
    breaks: true,
  });
};

configureMarked();

// ─── preprocessMarkdown ──────────────────────────────────────────────────────

const normaliseListIndent = (line: string): string => {
  const match = line.match(/^(\s+)([*\-]|\d+\.)\s/);
  if (!match) return line;
  const indentLevel = Math.round(match[1].length / 2);
  return " ".repeat(indentLevel * 3) + line.trimStart();
};

const preprocessMarkdown = (markdown: string): string => {
  let inCodeBlock = false;
  const lines = markdown.split("\n");

  const hrIndices = new Set<number>();
  for (let i = 0; i < lines.length; i++) {
    if (!inCodeBlock && lines[i].trim() === "---") hrIndices.add(i);
    if (lines[i].trim().startsWith("```")) inCodeBlock = !inCodeBlock;
  }

  inCodeBlock = false;
  const result: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.trim().startsWith("```")) {
      inCodeBlock = !inCodeBlock;
      result.push(line);
      continue;
    }
    if (inCodeBlock) {
      result.push(line);
      continue;
    }
    if (line.trim() === "---") {
      result.push(line);
      continue;
    }
    if (line.trim() === "") {
      result.push(hrIndices.has(i - 1) || hrIndices.has(i + 1) ? "" : "&nbsp;");
      continue;
    }
    result.push(normaliseListIndent(line));
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
      const html = marked.parse(preprocessMarkdown(markdown));
      return { __html: html };
    } catch (error) {
      console.error("Markdown parsing error:", error);
      return { __html: '<p class="text-red-400">Error parsing markdown</p>' };
    }
  };

  return (
    <div className="w-full bg-background text-foreground text-lg">
      <div
        className="prose prose-invert max-w-none prose-pre:p-0 prose-pre:m-0 leading-6 pl-3 pr-2 pt-0 break-words text-lg font-sans"
        style={{
          wordWrap: "break-word",
          overflowWrap: "break-word",
          maxWidth: "100%",
          // @ts-expect-error: CSS custom property
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
