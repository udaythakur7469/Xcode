"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  getTerminalSequence,
  TerminalStep,
} from "@/lib/share/terminalLoaderSequences";

type QuestionResultsLoaderProps = {
  isLoading: boolean;
  /** Language currently being run/submitted, e.g. "cpp" | "java" | "python" | "javascript". */
  language?: string | null;
};

const FOOTER_MESSAGES = [
  "Compiling code",
  "Running against test cases",
  "Validating output",
  "Finalizing submission",
];

// Hard floor: a submission can take up to 40-45s server-side, so the same
// command must never appear twice within this window.
const MIN_REPEAT_GAP_MS = 45000;

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function stepToHtml(step: TerminalStep): string {
  if ("p" in step) {
    return `<span class="qrl-prompt">${step.p}</span> <span class="qrl-cmd">${escapeHtml(
      step.c,
    )}</span>`;
  }
  if ("ok" in step) {
    return `<span class="qrl-ok">✓</span> <span class="qrl-info">${escapeHtml(step.ok)}</span>`;
  }
  return `<span class="qrl-comment"># </span><span class="qrl-info">${escapeHtml(step.i)}</span>`;
}

const QuestionResultsLoader: React.FC<QuestionResultsLoaderProps> = ({
  isLoading,
  language,
}) => {
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const cursorRef = useRef<HTMLSpanElement | null>(null);
  const timersRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);
  const [footerIndex, setFooterIndex] = useState(0);
  const [footerDots, setFooterDots] = useState("");

  const sequence = getTerminalSequence(language);

  useEffect(() => {
    const clearTimers = () => {
      timersRef.current.forEach((t) => clearTimeout(t));
      timersRef.current = [];
    };

    if (!isLoading) {
      clearTimers();
      if (bodyRef.current) bodyRef.current.innerHTML = "";
      cursorRef.current = null;
      return;
    }

    const body = bodyRef.current;
    if (!body) return;

    let cancelled = false;

    const removeCursor = () => {
      cursorRef.current?.remove();
      cursorRef.current = null;
    };

    const appendLine = (html: string) => {
      removeCursor(); // never leave a stray blinking cursor behind on a finished line
      const wasNearBottom =
        body.scrollHeight - body.scrollTop - body.clientHeight < 40;
      const div = document.createElement("div");
      div.className = "qrl-line";
      div.innerHTML = html;
      body.appendChild(div);
      // only auto-scroll if the user hasn't scrolled up to read earlier commands
      if (wasNearBottom) body.scrollTop = body.scrollHeight;
      return div;
    };

    const showCursorOnLine = (lineDiv: HTMLDivElement) => {
      removeCursor();
      const cursor = document.createElement("span");
      cursor.className = "qrl-cursor";
      lineDiv.appendChild(cursor);
      cursorRef.current = cursor;
    };

    // seqIndex loops forever through `sequence`; passStart tracks when the
    // current pass began so we can enforce the 45s floor before letting
    // that pass's commands reappear. Note: the terminal is never cleared —
    // a repeat pass just keeps appending below the last line, like real
    // shell scrollback.
    let seqIndex = 0;
    let passStart = Date.now();

    const typeNext = () => {
      if (cancelled) return;

      if (seqIndex >= sequence.length) {
        const elapsed = Date.now() - passStart;
        const wait = Math.max(600, MIN_REPEAT_GAP_MS - elapsed);
        timersRef.current.push(
          setTimeout(() => {
            seqIndex = 0;
            passStart = Date.now();
            typeNext();
          }, wait),
        );
        return;
      }

      const step = sequence[seqIndex];
      const lineDiv = appendLine(stepToHtml(step));
      // cursor sits on the line that was just "typed", like a real shell
      // waiting after a command finished printing — then hands off to the next
      showCursorOnLine(lineDiv);

      seqIndex++;
      const isCommand = "p" in step;
      timersRef.current.push(setTimeout(typeNext, isCommand ? 900 : 700));
    };

    typeNext();

    // footer status message cycling
    const dotsInterval = setInterval(() => {
      setFooterDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 450);
    const messageInterval = setInterval(() => {
      setFooterIndex((prev) => (prev + 1) % FOOTER_MESSAGES.length);
    }, 1600);

    return () => {
      cancelled = true;
      clearTimers();
      clearInterval(dotsInterval);
      clearInterval(messageInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, language]);

  if (!isLoading) return null;

  return (
    <div className="h-full w-full flex flex-col bg-[#0a0a0b]">
      <style>{`
        .qrl-body::-webkit-scrollbar { width: 0; height: 0; }
        .qrl-body { scrollbar-width: none; -ms-overflow-style: none; }
        .qrl-line { opacity: 0; animation: qrl-in 0.2s forwards; white-space: pre-wrap; word-break: break-word; }
        @keyframes qrl-in { to { opacity: 1; } }
        .qrl-prompt { color: #22C55E; }
        .qrl-cmd { color: #fafafa; }
        .qrl-comment { color: #71717a; }
        .qrl-info { color: #71717a; }
        .qrl-ok { color: #22C55E; }
        .qrl-cursor {
          display: inline-block; width: 7px; height: 14px; background: #22C55E;
          vertical-align: text-bottom; margin-left: 2px; animation: qrl-blink 1s step-end infinite;
        }
        @keyframes qrl-blink { 50% { opacity: 0; } }
        .qrl-spin {
          width: 14px; height: 14px; border-radius: 9999px; border: 2px solid #333338;
          border-top-color: #22C55E; animation: qrl-spin 0.7s linear infinite; flex-shrink: 0;
        }
        @keyframes qrl-spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* Terminal body — fills the container, no title bar */}
      <div
        ref={bodyRef}
        className="qrl-body flex-1 px-4 py-3.5 font-mono text-[13px] leading-[1.85] text-zinc-300 overflow-y-auto flex flex-col"
      />

      {/* Footer status */}
      <div className="flex-shrink-0 flex items-center gap-2.5 px-4 py-3 border-t border-zinc-800 font-sans">
        <div className="qrl-spin" />
        <div className="text-[13px] font-medium text-white">
          <span>{FOOTER_MESSAGES[footerIndex]}</span>
          <span className="text-zinc-400">{footerDots}</span>
        </div>
      </div>
    </div>
  );
};

export default QuestionResultsLoader;
