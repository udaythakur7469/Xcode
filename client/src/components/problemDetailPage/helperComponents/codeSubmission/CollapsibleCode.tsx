import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { Light as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomOneDark } from "react-syntax-highlighter/dist/esm/styles/hljs";

// ─── Smart line cutoff ──────────────────────────────────────────────────────
// Finds the line index to stop the collapsed preview at: the 3rd-5th
// non-trivial line (skips blank lines and lines that are only a brace/
// bracket/semicolon), so the preview never cuts off on a lone "{" or an
// empty line, which would look broken rather than intentional.

const TRIVIAL_LINE = /^[{}()[\];]*$/;

function computeCutoffLine(code: string): number {
  const lines = code.split("\n");
  let nonTrivialCount = 0;
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed.length > 0 && !TRIVIAL_LINE.test(trimmed)) {
      nonTrivialCount++;
    }
    if (nonTrivialCount >= 5) return i + 1;
    if (nonTrivialCount >= 3 && i >= 4) return i + 1;
  }
  // Code shorter than the cutoff target — nothing to collapse.
  return lines.length;
}

// ─── Animated AI button ─────────────────────────────────────────────────────
// Framer Motion conic-style rotating border, matching the slow/premium
// treatment used elsewhere in the app. Button only — no AI panel; that is
// explicitly out of scope for this redesign.

function AnalyzeWithAIButton({ onClick }: { onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative inline-flex items-center gap-1.5 rounded-lg px-3.5 py-[7px] text-[11.5px] font-semibold bg-secondary border border-border overflow-hidden isolate"
    >
      <Sparkles size={13} strokeWidth={2.2} className="text-blue-500" />
      <span className="bg-gradient-to-r from-blue-500 via-violet-500 to-blue-500 bg-clip-text text-transparent bg-[length:200%_auto] animate-shimmer">
        Analyze with AI
      </span>
    </button>
  );
}

// ─── CollapsibleCode ─────────────────────────────────────────────────────────

type CollapsibleCodeProps = {
  code: string;
  hlLang: string;
  langLabel: string;
  showAIButton?: boolean;
  onAnalyzeWithAI?: () => void;
};

export function CollapsibleCode({
  code,
  hlLang,
  langLabel,
  showAIButton = false,
  onAnalyzeWithAI,
}: CollapsibleCodeProps) {
  const [expanded, setExpanded] = useState(false);

  const cutoffLine = useMemo(() => computeCutoffLine(code), [code]);
  const totalLines = useMemo(() => code.split("\n").length, [code]);
  const isCollapsible = totalLines > cutoffLine;

  // Rough collapsed height: line height (~1.65 * 12px font) * cutoff lines,
  // plus vertical padding — kept generous enough that the fade reads as
  // intentional framing rather than an abrupt clip mid-line.
  const collapsedMaxHeight = 24 + cutoffLine * 20;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">
          Submitted Code
        </p>
        <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-secondary border border-border/10 text-muted-foreground">
          {langLabel}
        </span>
      </div>

      <div className="relative rounded-lg overflow-hidden border border-border/10">
        <motion.div
          animate={{
            maxHeight: expanded || !isCollapsible ? 520 : collapsedMaxHeight,
          }}
          initial={false}
          transition={{ duration: 0.32, ease: "easeInOut" }}
          className="overflow-y-auto"
        >
          <SyntaxHighlighter
            language={hlLang}
            style={atomOneDark}
            showLineNumbers
            customStyle={{
              margin: 0,
              padding: "12px",
              fontSize: "12px",
              lineHeight: "1.65",
              background: "transparent",
            }}
            lineNumberStyle={{
              minWidth: "2.5em",
              paddingRight: "1em",
              color: "#4b5563",
              userSelect: "none",
            }}
          >
            {code}
          </SyntaxHighlighter>
        </motion.div>

        {isCollapsible && !expanded && (
          <div
            className="pointer-events-none absolute left-0 right-0 bottom-0 h-14"
            style={{
              background:
                "linear-gradient(to bottom, transparent, rgba(15,16,18,0.96) 88%)",
            }}
          />
        )}
      </div>

      <div className="flex items-center gap-2 pt-2.5">
        {isCollapsible && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="text-[11.5px] font-semibold px-3.5 py-[7px] rounded-lg border border-border/15 bg-secondary text-muted-foreground hover:text-foreground hover:border-border/30 transition-colors"
          >
            {expanded ? "Hide Code" : "Show Full Code"}
          </button>
        )}
        {showAIButton && <AnalyzeWithAIButton onClick={onAnalyzeWithAI} />}
      </div>
    </div>
  );
}
