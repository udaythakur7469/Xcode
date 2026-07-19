"use client";

import React, { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

type MarkdownGuideBoxProps = {};

const SECTIONS = [
  // Markdown sections
  { id: "text-formatting", label: "✍️ Text Formatting", group: "markdown" },
  { id: "headings", label: "🏷️ Headings", group: "markdown" },
  { id: "lists", label: "📋 Lists", group: "markdown" },
  { id: "code", label: "💻 Code", group: "markdown" },
  { id: "table", label: "📊 Table", group: "markdown" },
  { id: "quote", label: "💬 Quote", group: "markdown" },
  { id: "horizontal-rule", label: "➖ Horizontal Rule", group: "markdown" },
  { id: "links-images", label: "🔗 Links & Images", group: "markdown" },
  { id: "reset", label: "🔄 Reset Button", group: "markdown" },
  { id: "best-practices", label: "✅ Best Practices", group: "markdown" },
  // AI sections
  { id: "ai-overview", label: "✨ Write with AI", group: "ai" },
  { id: "ai-modes", label: "🎛️ Generation Modes", group: "ai" },
  { id: "ai-prompt", label: "✏️ Prompt Input", group: "ai" },
  { id: "ai-tone", label: "🎨 Tone Selector", group: "ai" },
  { id: "ai-generate", label: "⚡ Generate / Stop / Regen", group: "ai" },
  { id: "ai-streaming", label: "▍ Live Streaming", group: "ai" },
  { id: "ai-history", label: "🕒 Prompt History", group: "ai" },
  { id: "ai-undo", label: "↩️ Undo Generation", group: "ai" },
  { id: "ai-title", label: "🏷️ Suggest Title", group: "ai" },
  { id: "ai-tags", label: "🏷️ Suggest Tags", group: "ai" },
  { id: "ai-confirm", label: "⚠️ Replace Confirmation", group: "ai" },
  { id: "ai-best-practices", label: "✅ AI Best Practices", group: "ai" },
];

const MarkdownGuideBox: React.FC<MarkdownGuideBoxProps> = () => {
  const contentRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const spacerRef = useRef<HTMLDivElement>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState("text-formatting");

  const handleJump = (id: string) => {
    const el = document.getElementById(id);
    if (el && contentRef.current) {
      const container = contentRef.current;
      const elTop = el.offsetTop - container.offsetTop;
      container.scrollTo({ top: elTop - 24, behavior: "smooth" });
      setActiveSection(id);
    }
  };

  // Scroll-spy: keep the sidebar highlight in sync with whichever section
  // is actually visible as the user scrolls, not just the last one clicked.
  useEffect(() => {
    const container = contentRef.current;
    if (!container) return;

    const sectionEls = SECTIONS.map((s) =>
      document.getElementById(s.id),
    ).filter((el): el is HTMLElement => el !== null);
    if (sectionEls.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Among all sections currently in the "active zone" (see
        // rootMargin below), pick the one closest to the top of the
        // scroll container — that's the section the user is reading.
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible.length > 0) {
          setActiveSection(visible[0].target.id);
        }
      },
      {
        root: container,
        // A section counts as "active" once it crosses into the top 40%
        // of the scroll container, and stops counting once it passes the
        // bottom 60% — this keeps the highlight matched to what's on
        // screen instead of switching too early or too late.
        rootMargin: "0px 0px -60% 0px",
        threshold: 0,
      },
    );

    sectionEls.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const markdownSections = SECTIONS.filter((s) => s.group === "markdown");
  const aiSections = SECTIONS.filter((s) => s.group === "ai");

  // Keep the sidebar itself scrolled so the currently active section's
  // link is always visible, even if it was brought into view by manual
  // content scrolling rather than by clicking a sidebar link.
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    const activeLink = nav.querySelector<HTMLButtonElement>(
      `[data-section-id="${activeSection}"]`,
    );
    if (!activeLink) return;

    activeLink.scrollIntoView({ block: "nearest" });
  }, [activeSection]);

  // Size the trailing spacer to exactly however much extra scroll room
  // the last section needs to reach the top of the viewport when
  // clicked — no more. Without this, the container's maximum scroll
  // position could fall short of that target (leaving the last section
  // stuck partway down); a flat oversized spacer would overshoot it
  // instead, leaving dead space visible once scrolled all the way down.
  useEffect(() => {
    const container = contentRef.current;
    const spacer = spacerRef.current;
    if (!container || !spacer) return;

    const recalculate = () => {
      spacer.style.height = "0px";

      const lastSection = SECTIONS[SECTIONS.length - 1];
      const lastEl = document.getElementById(lastSection.id);
      if (!lastEl) return;

      const target = lastEl.offsetTop - container.offsetTop - 24;
      const maxScroll = container.scrollHeight - container.clientHeight;
      const needed = target - maxScroll;

      spacer.style.height = needed > 0 ? `${needed}px` : "0px";
    };

    recalculate();
    window.addEventListener("resize", recalculate);
    return () => window.removeEventListener("resize", recalculate);
  }, []);

  return (
    <div className="flex max-h-[75vh] overflow-hidden">
      {/* ── Left Sidebar ─────────────────────────────────────────────────── */}
      <AnimatePresence initial={false}>
        {isSidebarOpen && (
          <motion.div
            key="sidebar"
            initial={{ width: 0, x: -16, opacity: 0 }}
            animate={{ width: 208, x: 0, opacity: 1 }}
            exit={{ width: 0, x: -16, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="shrink-0 overflow-hidden border-r border-border"
          >
            <div className="w-52 h-full flex flex-col">
              {/* Sidebar header */}
              <div className="flex items-center justify-between px-4 py-4 border-b border-border">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Contents
                </span>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="rounded p-1 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  title="Close index"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Nav */}
              <nav
                ref={navRef}
                className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5 scrollbar-transparent"
              >
                <p className="text-xs font-semibold text-muted-foreground px-2 pb-1 pt-0.5">
                  Markdown
                </p>
                {markdownSections.map((s) => (
                  <button
                    key={s.id}
                    data-section-id={s.id}
                    onClick={() => handleJump(s.id)}
                    className={`w-full text-left rounded-md px-2 py-1.5 text-xs transition-colors leading-snug ${
                      activeSection === s.id
                        ? "bg-violet-50 text-violet-600 font-medium dark:bg-violet-950/30 dark:text-violet-400"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}

                <div className="my-2 border-t border-border" />
                <p className="px-1 py-2 space-y-0.5">
                  <p className="text-xs font-semibold text-muted-foreground px-2 pb-1 pt-0.5">
                    AI features
                  </p>
                </p>
                {aiSections.map((s) => (
                  <button
                    key={s.id}
                    data-section-id={s.id}
                    onClick={() => handleJump(s.id)}
                    className={`w-full text-left rounded-md px-2 py-1.5 text-xs transition-colors leading-snug ${
                      activeSection === s.id
                        ? "bg-violet-50 text-violet-600 font-medium dark:bg-violet-950/30 dark:text-violet-400"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </nav>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Right Content ─────────────────────────────────────────────────── */}
      <div
        ref={contentRef}
        className="flex-1 overflow-y-auto px-8 py-6 scrollbar-transparent"
      >
        {/* Hamburger — always visible top-left of content when sidebar is closed */}
        {!isSidebarOpen && (
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="mb-6 flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            title="Open index"
          >
            <Menu size={14} />
            Contents
          </button>
        )}

        {/* Main Title */}
        <h1 className="text-4xl font-bold mb-4 flex flex-row justify-center">
          Editor Guide — Markdown & Write with AI
        </h1>

        <p className="text-muted-foreground mb-6 leading-relaxed text-base">
          This guide covers everything in the post editor:{" "}
          <strong>Markdown formatting</strong> syntax for all toolbar buttons,
          and the full <strong>Write with AI</strong> feature set. Use the index
          on the left to jump to any section instantly.
        </p>

        <div className="bg-secondary/50 border border-border rounded-md px-5 py-4 mb-10">
          <p className="text-sm font-semibold mb-2">💡 Pro tip</p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            The <strong>live preview panel</strong> on the right updates in real
            time as you type — you always see exactly how your post will look
            before publishing.
          </p>
        </div>

        <hr className="my-8 border-border" />

        {/* ── TEXT FORMATTING ─────────────────────────────────────────────── */}
        <section id="text-formatting" className="mb-12">
          <h2 className="text-3xl font-semibold mb-6 flex items-center gap-3">
            <span className="text-2xl">✍️</span> Text Formatting
          </h2>
          <p className="text-muted-foreground mb-6 text-base leading-relaxed">
            <strong>Tip:</strong> For all formatting buttons — you can either{" "}
            <strong>select text first then click the button</strong> (wraps your
            selection), or <strong>click the button first then type</strong>{" "}
            between the inserted markers.
          </p>

          {/* Bold */}
          <div className="mb-10">
            <h3 className="text-2xl font-semibold mb-4">
              Bold (
              <code className="text-sm bg-secondary px-3 py-1.5 rounded">
                B
              </code>
              )
            </h3>
            <p className="text-muted-foreground mb-3 text-base leading-relaxed">
              <strong>What it does:</strong> Makes text bold.
            </p>
            <pre className="bg-card border border-border text-foreground p-5 rounded-md mb-3 overflow-x-auto font-mono text-sm">
              <code>**bold text**</code>
            </pre>
            <div className="bg-secondary/50 border border-border p-4 rounded-md mb-4">
              <p className="text-sm text-muted-foreground mb-2 font-semibold">
                Result:
              </p>
              <p className="text-base">
                <strong>bold text</strong>
              </p>
            </div>
            <pre className="bg-card border border-border text-foreground p-5 rounded-md mb-3 overflow-x-auto font-mono text-sm">
              <code>This is **important** information.</code>
            </pre>
            <div className="bg-secondary/50 border border-border p-4 rounded-md mb-4">
              <p className="text-sm text-muted-foreground mb-2 font-semibold">
                Result:
              </p>
              <p className="text-base">
                This is <strong>important</strong> information.
              </p>
            </div>
          </div>

          {/* Italic */}
          <div className="mb-10">
            <h3 className="text-2xl font-semibold mb-4">
              Italic (
              <code className="text-sm bg-secondary px-3 py-1.5 rounded">
                I
              </code>
              )
            </h3>
            <p className="text-muted-foreground mb-3 text-base leading-relaxed">
              <strong>What it does:</strong> Italicizes text.
            </p>
            <pre className="bg-card border border-border text-foreground p-5 rounded-md mb-3 overflow-x-auto font-mono text-sm">
              <code>*italic text*</code>
            </pre>
            <div className="bg-secondary/50 border border-border p-4 rounded-md mb-4">
              <p className="text-sm text-muted-foreground mb-2 font-semibold">
                Result:
              </p>
              <p className="text-base">
                <em>italic text</em>
              </p>
            </div>
          </div>

          {/* Strikethrough */}
          <div className="mb-10">
            <h3 className="text-2xl font-semibold mb-4">Strikethrough</h3>
            <p className="text-muted-foreground mb-3 text-base leading-relaxed">
              <strong>What it does:</strong> Draws a line through text. Useful
              for showing a wrong approach or a rejected idea.
            </p>
            <pre className="bg-card border border-border text-foreground p-5 rounded-md mb-3 overflow-x-auto font-mono text-sm">
              <code>~~strikethrough text~~</code>
            </pre>
            <div className="bg-secondary/50 border border-border p-4 rounded-md mb-4">
              <p className="text-sm text-muted-foreground mb-2 font-semibold">
                Result:
              </p>
              <p className="text-base">
                <s>strikethrough text</s>
              </p>
            </div>
            <pre className="bg-card border border-border text-foreground p-5 rounded-md mb-3 overflow-x-auto font-mono text-sm">
              <code>
                ~~O(n²) brute force~~ → optimized to O(n) with a hash map.
              </code>
            </pre>
            <div className="bg-secondary/50 border border-border p-4 rounded-md mb-4">
              <p className="text-sm text-muted-foreground mb-2 font-semibold">
                Result:
              </p>
              <p className="text-base">
                <s>O(n²) brute force</s> → optimized to O(n) with a hash map.
              </p>
            </div>
          </div>
        </section>

        <hr className="my-8 border-border" />

        {/* ── HEADINGS ────────────────────────────────────────────────────── */}
        <section id="headings" className="mb-12">
          <h2 className="text-3xl font-semibold mb-6 flex items-center gap-3">
            <span className="text-2xl">🏷️</span> Headings
          </h2>
          <p className="text-muted-foreground mb-6 text-base leading-relaxed">
            Headings help structure your post and improve readability. Use them
            to separate sections like Intuition, Approach, and Complexity.
          </p>
          <div className="mb-8">
            <h3 className="text-2xl font-semibold mb-4">Heading 1 (H1)</h3>
            <pre className="bg-card border border-border text-foreground p-5 rounded-md mb-3 overflow-x-auto font-mono text-sm">
              <code># Heading 1</code>
            </pre>
            <div className="bg-secondary/50 border border-border p-4 rounded-md mb-3">
              <p className="text-sm text-muted-foreground mb-2 font-semibold">
                Result:
              </p>
              <h1 className="text-3xl font-bold">Heading 1</h1>
            </div>
            <p className="text-muted-foreground text-base leading-relaxed">
              Use for main titles or top-level section names.
            </p>
          </div>
          <div className="mb-8">
            <h3 className="text-2xl font-semibold mb-4">Heading 2 (H2)</h3>
            <pre className="bg-card border border-border text-foreground p-5 rounded-md mb-3 overflow-x-auto font-mono text-sm">
              <code>## Heading 2</code>
            </pre>
            <div className="bg-secondary/50 border border-border p-4 rounded-md mb-3">
              <p className="text-sm text-muted-foreground mb-2 font-semibold">
                Result:
              </p>
              <h2 className="text-2xl font-semibold">Heading 2</h2>
            </div>
            <p className="text-muted-foreground text-base leading-relaxed">
              Use for subsections within a main section.
            </p>
          </div>
          <div className="mb-8">
            <h3 className="text-2xl font-semibold mb-4">Heading 3 (H3)</h3>
            <pre className="bg-card border border-border text-foreground p-5 rounded-md mb-3 overflow-x-auto font-mono text-sm">
              <code>### Heading 3</code>
            </pre>
            <div className="bg-secondary/50 border border-border p-4 rounded-md mb-3">
              <p className="text-sm text-muted-foreground mb-2 font-semibold">
                Result:
              </p>
              <h3 className="text-xl font-semibold">Heading 3</h3>
            </div>
            <p className="text-muted-foreground text-base leading-relaxed">
              Use for deeper breakdowns or nested topics.
            </p>
          </div>
        </section>

        <hr className="my-8 border-border" />

        {/* ── LISTS ───────────────────────────────────────────────────────── */}
        <section id="lists" className="mb-12">
          <h2 className="text-3xl font-semibold mb-6 flex items-center gap-3">
            <span className="text-2xl">📋</span> Lists
          </h2>
          <div className="mb-10">
            <h3 className="text-2xl font-semibold mb-4">Bullet List</h3>
            <pre className="bg-card border border-border text-foreground p-5 rounded-md mb-3 overflow-x-auto font-mono text-sm">
              <code>{`* Item one\n* Item two\n* Item three`}</code>
            </pre>
            <div className="bg-secondary/50 border border-border p-4 rounded-md mb-4">
              <p className="text-sm text-muted-foreground mb-2 font-semibold">
                Result:
              </p>
              <ul className="list-disc list-outside ml-5 space-y-1">
                <li>Item one</li>
                <li>Item two</li>
                <li>Item three</li>
              </ul>
            </div>
            <p className="text-muted-foreground text-base leading-relaxed">
              <strong>Tip:</strong> Press <strong>Enter</strong> at the end of a
              bullet line and the editor automatically adds the next{" "}
              <code className="text-sm bg-secondary px-2 py-1 rounded">* </code>{" "}
              for you.
            </p>
          </div>
          <div className="mb-10">
            <h3 className="text-2xl font-semibold mb-4">Numbered List</h3>
            <pre className="bg-card border border-border text-foreground p-5 rounded-md mb-3 overflow-x-auto font-mono text-sm">
              <code>{`1. First step\n2. Second step\n3. Third step`}</code>
            </pre>
            <div className="bg-secondary/50 border border-border p-4 rounded-md mb-4">
              <p className="text-sm text-muted-foreground mb-2 font-semibold">
                Result:
              </p>
              <ol className="list-decimal list-outside ml-5 space-y-1">
                <li>First step</li>
                <li>Second step</li>
                <li>Third step</li>
              </ol>
            </div>
          </div>
          <div className="mb-10">
            <h3 className="text-2xl font-semibold mb-4">Nested Lists</h3>
            <p className="text-muted-foreground mb-4 text-base leading-relaxed">
              Indent child items by <strong>2 spaces</strong> relative to their
              parent. Press <strong>Tab</strong> in the editor to indent,{" "}
              <strong>Shift+Tab</strong> to outdent.
            </p>
            <pre className="bg-card border border-border text-foreground p-5 rounded-md mb-3 overflow-x-auto font-mono text-sm">
              <code>{`* Algorithms\n  * Sorting\n    * Merge Sort\n  * Searching\n* Data Structures`}</code>
            </pre>
            <div className="bg-secondary/50 border border-border p-4 rounded-md mb-4">
              <p className="text-sm text-muted-foreground mb-2 font-semibold">
                Result:
              </p>
              <ul className="list-disc list-outside ml-5 space-y-1">
                <li>
                  Algorithms
                  <ul className="list-disc list-outside ml-5 mt-1 space-y-1">
                    <li>
                      Sorting
                      <ul className="list-disc list-outside ml-5 mt-1">
                        <li>Merge Sort</li>
                      </ul>
                    </li>
                    <li>Searching</li>
                  </ul>
                </li>
                <li>Data Structures</li>
              </ul>
            </div>
          </div>
        </section>

        <hr className="my-8 border-border" />

        {/* ── CODE ────────────────────────────────────────────────────────── */}
        <section id="code" className="mb-12">
          <h2 className="text-3xl font-semibold mb-6 flex items-center gap-3">
            <span className="text-2xl">💻</span> Code
          </h2>
          <div className="mb-10">
            <h3 className="text-2xl font-semibold mb-4">Inline Code</h3>
            <pre className="bg-card border border-border text-foreground p-5 rounded-md mb-3 overflow-x-auto font-mono text-sm">
              <code>{"`variable_name`"}</code>
            </pre>
            <div className="bg-secondary/50 border border-border p-4 rounded-md mb-4">
              <p className="text-sm text-muted-foreground mb-2 font-semibold">
                Result:
              </p>
              <p>
                Use{" "}
                <code className="bg-secondary px-2 py-0.5 rounded text-sm">
                  variable_name
                </code>{" "}
                in your sentence.
              </p>
            </div>
          </div>
          <div className="mb-10">
            <h3 className="text-2xl font-semibold mb-4">Code Block</h3>
            <pre className="bg-card border border-border text-foreground p-5 rounded-md mb-3 overflow-x-auto font-mono text-sm">
              <code>{`\`\`\`python\ndef twoSum(nums, target):\n    seen = {}\n    for i, n in enumerate(nums):\n        if target - n in seen:\n            return [seen[target - n], i]\n        seen[n] = i\n\`\`\``}</code>
            </pre>
            <div className="bg-secondary/50 border border-border p-4 rounded-md mb-4">
              <p className="text-sm text-muted-foreground mb-2 font-semibold">
                Result:
              </p>
              <pre className="bg-card border border-border p-3 rounded text-sm overflow-x-auto">
                <code>{`def twoSum(nums, target):\n    seen = {}\n    for i, n in enumerate(nums):\n        if target - n in seen:\n            return [seen[target - n], i]\n        seen[n] = i`}</code>
              </pre>
            </div>
            <p className="text-muted-foreground text-base leading-relaxed">
              <strong>Tip:</strong> Your solution code is automatically inserted
              in a code block with the correct language when you open the
              editor.
            </p>
          </div>
        </section>

        <hr className="my-8 border-border" />

        {/* ── TABLE ───────────────────────────────────────────────────────── */}
        <section id="table" className="mb-12">
          <h2 className="text-3xl font-semibold mb-6 flex items-center gap-3">
            <span className="text-2xl">📊</span> Table
          </h2>
          <pre className="bg-card border border-border text-foreground p-5 rounded-md mb-3 overflow-x-auto font-mono text-sm">
            <code>{`| Approach    | Time  | Space |\n| ----------- | ----- | ----- |\n| Brute Force | O(n²) | O(1)  |\n| Hash Map    | O(n)  | O(n)  |`}</code>
          </pre>
          <div className="bg-secondary/50 border border-border p-4 rounded-md mb-4">
            <p className="text-sm text-muted-foreground mb-3 font-semibold">
              Result:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-border text-sm rounded-lg overflow-hidden">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-2 border border-border font-semibold text-left">
                      Approach
                    </th>
                    <th className="px-4 py-2 border border-border font-semibold text-left">
                      Time
                    </th>
                    <th className="px-4 py-2 border border-border font-semibold text-left">
                      Space
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-4 py-2 border border-border text-muted-foreground">
                      Brute Force
                    </td>
                    <td className="px-4 py-2 border border-border text-muted-foreground">
                      O(n²)
                    </td>
                    <td className="px-4 py-2 border border-border text-muted-foreground">
                      O(1)
                    </td>
                  </tr>
                  <tr className="bg-muted/30">
                    <td className="px-4 py-2 border border-border text-muted-foreground">
                      Hash Map
                    </td>
                    <td className="px-4 py-2 border border-border text-muted-foreground">
                      O(n)
                    </td>
                    <td className="px-4 py-2 border border-border text-muted-foreground">
                      O(n)
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <hr className="my-8 border-border" />

        {/* ── QUOTE ───────────────────────────────────────────────────────── */}
        <section id="quote" className="mb-12">
          <h2 className="text-3xl font-semibold mb-6 flex items-center gap-3">
            <span className="text-2xl">💬</span> Quote
          </h2>
          <pre className="bg-card border border-border text-foreground p-5 rounded-md mb-3 overflow-x-auto font-mono text-sm">
            <code>{`> This is an important note.`}</code>
          </pre>
          <div className="bg-secondary/50 border border-border p-4 rounded-md mb-4">
            <p className="text-sm text-muted-foreground mb-2 font-semibold">
              Result:
            </p>
            <blockquote className="border-l-4 border-border pl-4 italic">
              This is an important note.
            </blockquote>
          </div>
        </section>

        <hr className="my-8 border-border" />

        {/* ── HORIZONTAL RULE ─────────────────────────────────────────────── */}
        <section id="horizontal-rule" className="mb-12">
          <h2 className="text-3xl font-semibold mb-6 flex items-center gap-3">
            <span className="text-2xl">➖</span> Horizontal Rule
          </h2>
          <pre className="bg-card border border-border text-foreground p-5 rounded-md mb-3 overflow-x-auto font-mono text-sm">
            <code>{`Some content above\n\n---\n\nSome content below`}</code>
          </pre>
          <div className="bg-secondary/50 border border-border p-4 rounded-md mb-4">
            <p className="text-sm text-muted-foreground mb-2 font-semibold">
              Result:
            </p>
            <p className="text-base mb-3">Some content above</p>
            <hr className="border-border my-2" />
            <p className="text-base mt-3">Some content below</p>
          </div>
          <p className="text-muted-foreground text-base leading-relaxed">
            <strong>Tip:</strong> Always leave a blank line before and after{" "}
            <code className="text-sm bg-secondary px-2 py-1 rounded">---</code>.
          </p>
        </section>

        <hr className="my-8 border-border" />

        {/* ── LINKS & IMAGES ──────────────────────────────────────────────── */}
        <section id="links-images" className="mb-12">
          <h2 className="text-3xl font-semibold mb-6 flex items-center gap-3">
            <span className="text-2xl">🔗</span> Links &amp; Images
          </h2>
          <div className="mb-10">
            <h3 className="text-2xl font-semibold mb-4">Link</h3>
            <pre className="bg-card border border-border text-foreground p-5 rounded-md mb-3 overflow-x-auto font-mono text-sm">
              <code>{`[Link Text](https://example.com)`}</code>
            </pre>
            <div className="bg-secondary/50 border border-border p-4 rounded-md mb-4">
              <p className="text-sm text-muted-foreground mb-2 font-semibold">
                Result:
              </p>
              <a
                href="https://example.com"
                className="text-blue-600 underline hover:text-blue-800"
              >
                Link Text
              </a>
            </div>
          </div>
          <div className="mb-10">
            <h3 className="text-2xl font-semibold mb-4">Image Upload 🖼️</h3>
            <p className="text-muted-foreground mb-3 text-base leading-relaxed">
              <strong>What it does:</strong> Opens a file picker to upload an
              image from your device. The image is uploaded to the cloud and
              automatically inserted into your post.
            </p>
            <ol className="list-decimal list-outside ml-6 text-muted-foreground space-y-2 text-base leading-relaxed mb-4">
              <li>
                Click the <strong>Image button</strong> in the toolbar
              </li>
              <li>Select an image from your device</li>
              <li>
                A{" "}
                <code className="text-sm bg-secondary px-2 py-1 rounded">
                  ![uploading...]
                </code>{" "}
                placeholder appears while it uploads
              </li>
              <li>
                Once uploaded, it&apos;s automatically replaced with the real
                image
              </li>
            </ol>
          </div>
        </section>

        <hr className="my-8 border-border" />

        {/* ── RESET ───────────────────────────────────────────────────────── */}
        <section id="reset" className="mb-12">
          <h2 className="text-3xl font-semibold mb-6 flex items-center gap-3">
            <span className="text-2xl">🔄</span> Reset Button
          </h2>
          <p className="text-muted-foreground mb-3 text-base leading-relaxed">
            <strong>What it does:</strong> Resets the editor content back to the
            original post template — including your solution code pre-filled in
            the code block. All edits will be discarded.
          </p>
          <p className="text-muted-foreground text-base leading-relaxed">
            <strong>When to use it:</strong> If you&apos;ve made a mess of the
            formatting and want a clean slate to start over.
          </p>
        </section>

        <hr className="my-8 border-border" />

        {/* ── BEST PRACTICES (MARKDOWN) ───────────────────────────────────── */}
        <section id="best-practices" className="mb-12">
          <h2 className="text-3xl font-semibold mb-6 flex items-center gap-3">
            <span className="text-2xl">✅</span> Best Practices for Writing
            Great Posts
          </h2>
          <ul className="list-disc list-outside ml-6 text-muted-foreground space-y-3 text-base leading-relaxed">
            <li>
              Use <strong>Headings</strong> to break your post into clear
              sections
            </li>
            <li>
              Always use <strong>Code Blocks</strong> for your solution — never
              paste raw code as plain text
            </li>
            <li>
              Use <strong>Inline Code</strong> for variable names and function
              references inside sentences
            </li>
            <li>
              Use a <strong>Table</strong> to compare approaches — e.g. brute
              force vs optimized
            </li>
            <li>
              Use <strong>Strikethrough</strong> to show a wrong approach you
              considered and ruled out
            </li>
            <li>
              Use <strong>Nested Lists</strong> to break down complex steps —
              Tab to go deeper, Shift+Tab to come back up
            </li>
            <li>Avoid walls of text — use lists and quotes to break it up</li>
            <li>
              Fill in the <strong>Edge Cases</strong> section — it shows depth
              of thinking
            </li>
            <li>
              Add a <strong>diagram or screenshot</strong> using the image
              upload button if your approach is visual
            </li>
          </ul>
        </section>

        <hr className="my-8 border-border" />

        {/* ════════════════════════════════════════════════════════════════════
            AI SECTION
        ════════════════════════════════════════════════════════════════════ */}

        <section id="ai-overview" className="mb-12">
          <h2 className="text-3xl font-semibold mb-4 flex items-center gap-3">
            <span className="text-2xl">✨</span> Write with AI
          </h2>
          <p className="text-muted-foreground mb-6 leading-relaxed text-base">
            The <strong>Write with AI</strong> system is a fully integrated AI
            writing assistant built directly into the post editor. It helps you
            generate, improve, continue, and summarize technical posts without
            ever leaving the editor.
          </p>
          <div className="bg-secondary/50 border border-border rounded-md px-5 py-4 mb-6">
            <p className="text-sm font-semibold mb-2">
              ✨ How to open the AI panel
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Click the <strong>✨ Write with AI</strong> button in the toolbar
              (after the image upload button). The panel expands from the bottom
              of the editor. Click it again to close it. Your prompt is
              preserved even after closing — reopening restores exactly what you
              typed.
            </p>
          </div>
        </section>

        <hr className="my-8 border-border" />

        {/* ── AI MODES ────────────────────────────────────────────────────── */}
        <section id="ai-modes" className="mb-12">
          <h2 className="text-3xl font-semibold mb-6 flex items-center gap-3">
            <span className="text-2xl">🎛️</span> Generation Modes
          </h2>
          <p className="text-muted-foreground mb-6 text-base leading-relaxed">
            At the top of the AI panel is a <strong>mode selector</strong> with
            four options. Each mode changes how the AI interprets your prompt
            and what it does with the current editor content.
          </p>

          <div className="mb-10">
            <h3 className="text-2xl font-semibold mb-4">
              Write{" "}
              <code className="text-sm bg-secondary px-3 py-1.5 rounded">
                Write from scratch
              </code>
            </h3>
            <p className="text-muted-foreground mb-3 text-base leading-relaxed">
              <strong>What it does:</strong> Generates a completely new post
              from your prompt. The current editor content is cleared first, and
              the AI writes fresh markdown directly into the editor as it
              streams.
            </p>
            <div className="bg-secondary/50 border border-border p-4 rounded-md mb-4">
              <p className="text-sm text-muted-foreground mb-2 font-semibold">
                Example prompts:
              </p>
              <ul className="list-disc list-outside ml-5 text-sm text-muted-foreground space-y-1">
                <li>Write a beginner-friendly guide to dynamic programming</li>
                <li>Compare Brute Force vs Optimal solutions for Two Sum</li>
                <li>Explain the sliding window technique with examples</li>
              </ul>
            </div>
            <div className="bg-secondary/50 border border-border px-5 py-4 rounded-md mb-4">
              <p className="text-sm font-semibold mb-2">⚠️ Important</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                If you have already written content in the editor, clicking{" "}
                <strong>Generate</strong> will show a confirmation dialog before
                replacing it.
              </p>
            </div>
          </div>

          <div className="mb-10">
            <h3 className="text-2xl font-semibold mb-4">
              Continue{" "}
              <code className="text-sm bg-secondary px-3 py-1.5 rounded">
                Continue writing
              </code>
            </h3>
            <p className="text-muted-foreground mb-3 text-base leading-relaxed">
              <strong>What it does:</strong> Reads your existing post content
              and seamlessly appends new content to it. The AI is aware of what
              you&apos;ve already written and continues from where you left off.
            </p>
            <div className="bg-secondary/50 border border-border p-4 rounded-md mb-4">
              <p className="text-sm text-muted-foreground mb-2 font-semibold">
                Example prompts:
              </p>
              <ul className="list-disc list-outside ml-5 text-sm text-muted-foreground space-y-1">
                <li>Add edge cases and sample test inputs</li>
                <li>Expand the complexity analysis section</li>
                <li>Write a final summary conclusion</li>
              </ul>
            </div>
          </div>

          <div className="mb-10">
            <h3 className="text-2xl font-semibold mb-4">
              Improve{" "}
              <code className="text-sm bg-secondary px-3 py-1.5 rounded">
                Improve this
              </code>
            </h3>
            <p className="text-muted-foreground mb-3 text-base leading-relaxed">
              <strong>What it does:</strong> Rewrites and improves your content.
              Has two behaviors depending on whether you have text selected:
            </p>
            <ul className="list-disc list-outside ml-6 text-muted-foreground space-y-2 text-base leading-relaxed mb-4">
              <li>
                <strong>Text selected:</strong> Only the selected range is
                rewritten. The rest of your post is untouched.
              </li>
              <li>
                <strong>No selection:</strong> The AI rewrites the entire post
                content.
              </li>
            </ul>
            <div className="bg-secondary/50 border border-border px-5 py-4 rounded-md mb-4">
              <p className="text-sm font-semibold mb-2">💡 Auto-switch tip</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                If you highlight text in the editor while the AI panel is open,
                the mode selector automatically switches to{" "}
                <strong>Improve</strong> for you.
              </p>
            </div>
          </div>

          <div className="mb-10">
            <h3 className="text-2xl font-semibold mb-4">
              Summarize{" "}
              <code className="text-sm bg-secondary px-3 py-1.5 rounded">
                Summarize
              </code>
            </h3>
            <p className="text-muted-foreground mb-3 text-base leading-relaxed">
              <strong>What it does:</strong> Reads your full post and generates
              a concise, well-structured summary in markdown.
            </p>
            <div className="bg-secondary/50 border border-border p-4 rounded-md mb-4">
              <p className="text-sm text-muted-foreground mb-2 font-semibold">
                Example prompts:
              </p>
              <ul className="list-disc list-outside ml-5 text-sm text-muted-foreground space-y-1">
                <li>Summarize key insights in bullet points</li>
                <li>Give a one-paragraph TL;DR</li>
                <li>Create a time/space complexity summary table</li>
              </ul>
            </div>
          </div>
        </section>

        <hr className="my-8 border-border" />

        {/* ── AI PROMPT ───────────────────────────────────────────────────── */}
        <section id="ai-prompt" className="mb-12">
          <h2 className="text-3xl font-semibold mb-6 flex items-center gap-3">
            <span className="text-2xl">✏️</span> The Prompt Input
          </h2>
          <p className="text-muted-foreground mb-6 text-base leading-relaxed">
            The large input area in the AI panel is where you describe what you
            want. It grows automatically as you type.
          </p>
          <div className="mb-8">
            <h3 className="text-2xl font-semibold mb-4">Keyboard shortcuts</h3>
            <div className="bg-secondary/50 border border-border p-4 rounded-md mb-4">
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-3">
                  <code className="bg-secondary px-2 py-1 rounded text-xs shrink-0">
                    Enter
                  </code>
                  <span>Submit your prompt and start generation</span>
                </li>
                <li className="flex items-start gap-3">
                  <code className="bg-secondary px-2 py-1 rounded text-xs shrink-0">
                    Shift + Enter
                  </code>
                  <span>Insert a new line inside the prompt</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="mb-8">
            <h3 className="text-2xl font-semibold mb-4">Quick-start chips</h3>
            <p className="text-muted-foreground mb-3 text-base leading-relaxed">
              When the prompt input is empty, a row of{" "}
              <strong>suggestion chips</strong> appears below it. These are
              pre-written prompts tailored to the selected mode. Click any chip
              to instantly fill the prompt.
            </p>
            <div className="bg-secondary/50 border border-border px-5 py-4 rounded-md">
              <p className="text-sm font-semibold mb-2">💡 Tip</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Chips hide the moment you start typing. They reappear if you
                clear the input. Switching modes updates the chips to match.
              </p>
            </div>
          </div>
        </section>

        <hr className="my-8 border-border" />

        {/* ── AI TONE ─────────────────────────────────────────────────────── */}
        <section id="ai-tone" className="mb-12">
          <h2 className="text-3xl font-semibold mb-6 flex items-center gap-3">
            <span className="text-2xl">🎨</span> Tone Selector
          </h2>
          <p className="text-muted-foreground mb-6 text-base leading-relaxed">
            The <strong>tone dropdown</strong> in the footer of the AI panel
            controls the writing style of generated content.
          </p>
          <div className="bg-secondary/50 border border-border p-4 rounded-md mb-6">
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li>
                <strong className="text-foreground">Technical</strong> —
                Default. Uses engineering vocabulary, assumes programming
                knowledge.
              </li>
              <li>
                <strong className="text-foreground">Beginner-friendly</strong> —
                Explains concepts from the ground up with plain-English
                explanations.
              </li>
              <li>
                <strong className="text-foreground">Concise</strong> — Short and
                to the point. No padding, no preamble.
              </li>
              <li>
                <strong className="text-foreground">Detailed</strong> —
                Thorough. Covers edge cases, nuances, and implementation
                details.
              </li>
            </ul>
          </div>
          <div className="bg-secondary/50 border border-border px-5 py-4 rounded-md">
            <p className="text-sm font-semibold mb-2">💡 Tip</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              The selected tone{" "}
              <strong>persists across multiple generations</strong> in the same
              session. It resets to <strong>Technical</strong> on a fresh page
              load.
            </p>
          </div>
        </section>

        <hr className="my-8 border-border" />

        {/* ── GENERATE / STOP / REGENERATE ────────────────────────────────── */}
        <section id="ai-generate" className="mb-12">
          <h2 className="text-3xl font-semibold mb-6 flex items-center gap-3">
            <span className="text-2xl">⚡</span> Generate, Stop &amp; Regenerate
          </h2>
          <div className="mb-10">
            <h3 className="text-2xl font-semibold mb-4">Generate button</h3>
            <p className="text-muted-foreground mb-3 text-base leading-relaxed">
              Sends your prompt to the AI and begins streaming the generated
              markdown directly into the editor. Disabled while generating to
              prevent duplicate submissions.
            </p>
          </div>
          <div className="mb-10">
            <h3 className="text-2xl font-semibold mb-4">Stop button</h3>
            <p className="text-muted-foreground mb-3 text-base leading-relaxed">
              Appears in place of Generate while streaming. Clicking it
              immediately aborts generation. Whatever has already streamed into
              the editor is kept — partial content is never lost.
            </p>
            <div className="bg-secondary/50 border border-border px-5 py-4 rounded-md mb-4">
              <p className="text-sm font-semibold mb-2">💡 Use case</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                If the AI starts going in the wrong direction, stop it early,
                refine your prompt, and regenerate.
              </p>
            </div>
          </div>
          <div className="mb-10">
            <h3 className="text-2xl font-semibold mb-4">Regenerate button</h3>
            <p className="text-muted-foreground mb-3 text-base leading-relaxed">
              After a successful generation, the Generate button is replaced by{" "}
              <strong>Regenerate</strong>. Clicking it re-runs the exact same
              prompt for a different output. The moment you edit the prompt, the
              button switches back to <strong>Generate</strong>.
            </p>
          </div>
        </section>

        <hr className="my-8 border-border" />

        {/* ── STREAMING ───────────────────────────────────────────────────── */}
        <section id="ai-streaming" className="mb-12">
          <h2 className="text-3xl font-semibold mb-6 flex items-center gap-3">
            <span className="text-2xl">▍</span> Live Streaming Preview
          </h2>
          <p className="text-muted-foreground mb-4 text-base leading-relaxed">
            While the AI is generating, content streams directly into the editor
            in real time. The live preview panel on the right updates
            simultaneously.
          </p>
          <p className="text-muted-foreground mb-4 text-base leading-relaxed">
            A pulsing violet cursor{" "}
            <span className="text-violet-500 font-mono font-bold">▍</span>{" "}
            appears at the end of the preview while streaming is in progress. It
            disappears automatically when generation completes or is stopped.
          </p>
        </section>

        <hr className="my-8 border-border" />

        {/* ── HISTORY ─────────────────────────────────────────────────────── */}
        <section id="ai-history" className="mb-12">
          <h2 className="text-3xl font-semibold mb-6 flex items-center gap-3">
            <span className="text-2xl">🕒</span> Prompt History
          </h2>
          <p className="text-muted-foreground mb-6 text-base leading-relaxed">
            The <strong>clock icon</strong> in the AI panel footer opens a
            dropdown showing your last 5 prompts. Clicking any item restores it
            into the prompt input instantly.
          </p>
          <div className="bg-secondary/50 border border-border p-4 rounded-md mb-4">
            <ul className="list-disc list-outside ml-5 text-sm text-muted-foreground space-y-1">
              <li>Up to 5 prompts stored per session</li>
              <li>Shared across all four modes</li>
              <li>Duplicates are de-duplicated (most recent wins)</li>
              <li>Resets when the page is refreshed</li>
            </ul>
          </div>
        </section>

        <hr className="my-8 border-border" />

        {/* ── UNDO ────────────────────────────────────────────────────────── */}
        <section id="ai-undo" className="mb-12">
          <h2 className="text-3xl font-semibold mb-6 flex items-center gap-3">
            <span className="text-2xl">↩️</span> Undo AI Generation
          </h2>
          <p className="text-muted-foreground mb-6 text-base leading-relaxed">
            Before every generation, a snapshot of your current content is
            saved. If you don&apos;t like the result, press{" "}
            <code className="text-sm bg-secondary px-2 py-1 rounded">
              Ctrl + Z
            </code>{" "}
            while the AI panel is open to restore the previous content
            instantly.
          </p>
          <div className="bg-secondary/50 border border-border px-5 py-4 rounded-md mb-4">
            <p className="text-sm font-semibold mb-2">⚠️ Important</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              This undo is for <strong>AI-generated actions only</strong> — not
              character-by-character typing. It only works while the AI panel is
              open.
            </p>
          </div>
        </section>

        <hr className="my-8 border-border" />

        {/* ── TITLE SUGGEST ───────────────────────────────────────────────── */}
        <section id="ai-title" className="mb-12">
          <h2 className="text-3xl font-semibold mb-6 flex items-center gap-3">
            <span className="text-2xl">🏷️</span> AI Title Suggestion
          </h2>
          <p className="text-muted-foreground mb-3 text-base leading-relaxed">
            <strong>What it does:</strong> Reads your current post content and
            generates a single optimized title — then fills it directly into the
            title field.
          </p>
          <p className="text-muted-foreground mb-3 text-base leading-relaxed">
            <strong>How to use it:</strong> Click the{" "}
            <strong>✨ Suggest</strong> button next to the title input. Click
            again to generate a different title. You can also type over it
            manually at any time.
          </p>
          <div className="bg-secondary/50 border border-border px-5 py-4 rounded-md mb-4">
            <p className="text-sm font-semibold mb-2">💡 Tip</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Write your post content first, then suggest a title. The more
              content is in the editor, the more accurate and specific the title
              will be.
            </p>
          </div>
        </section>

        <hr className="my-8 border-border" />

        {/* ── TAG SUGGEST ─────────────────────────────────────────────────── */}
        <section id="ai-tags" className="mb-12">
          <h2 className="text-3xl font-semibold mb-6 flex items-center gap-3">
            <span className="text-2xl">🏷️</span> AI Tag Suggestions
          </h2>
          <p className="text-muted-foreground mb-3 text-base leading-relaxed">
            <strong>What it does:</strong> Reads your post content and suggests
            4–5 relevant tags. Tags are shown as clickable chips — you choose
            which ones to add.
          </p>
          <div className="bg-secondary/50 border border-border p-4 rounded-md mb-4">
            <ul className="list-disc list-outside ml-5 text-sm text-muted-foreground space-y-1">
              <li>
                Tags you&apos;ve already selected are excluded from suggestions
              </li>
              <li>
                Added chips show as struck-through so you know they&apos;re
                applied
              </li>
              <li>Click ✕ to dismiss suggestions</li>
              <li>
                Click <strong>✨ Suggest tags</strong> again to refresh
              </li>
            </ul>
          </div>
        </section>

        <hr className="my-8 border-border" />

        {/* ── CONFIRM DIALOG ──────────────────────────────────────────────── */}
        <section id="ai-confirm" className="mb-12">
          <h2 className="text-3xl font-semibold mb-6 flex items-center gap-3">
            <span className="text-2xl">⚠️</span> Replace Content Confirmation
          </h2>
          <p className="text-muted-foreground mb-4 text-base leading-relaxed">
            Whenever you click <strong>Generate</strong> and the editor already
            contains content you&apos;ve modified, a confirmation dialog appears
            before anything is replaced.
          </p>
          <div className="bg-secondary/50 border border-border p-4 rounded-md mb-4">
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>
                <strong className="text-foreground">Proceed</strong> — Starts
                generating. Your existing content is replaced as the AI streams.
              </li>
              <li>
                <strong className="text-foreground">Cancel</strong> — Closes the
                dialog and the AI panel. Your content is completely untouched.
              </li>
            </ul>
          </div>
        </section>

        <hr className="my-8 border-border" />

        {/* ── AI BEST PRACTICES ───────────────────────────────────────────── */}
        <section id="ai-best-practices" className="mb-12">
          <h2 className="text-3xl font-semibold mb-6 flex items-center gap-3">
            <span className="text-2xl">✅</span> Best Practices for Using Write
            with AI
          </h2>
          <ul className="list-disc list-outside ml-6 text-muted-foreground space-y-3 text-base leading-relaxed">
            <li>
              Use <strong>Write mode</strong> for a first draft, then switch to{" "}
              <strong>Improve mode</strong> to refine specific sections
            </li>
            <li>
              Be specific in your prompts — &quot;Write a beginner guide to Two
              Sum with examples and complexity analysis&quot; gets far better
              results than &quot;write about Two Sum&quot;
            </li>
            <li>
              Use <strong>Concise</strong> tone when you want a dense post —{" "}
              <strong>Detailed</strong> when covering every angle
            </li>
            <li>
              Highlight a weak paragraph and use <strong>Improve mode</strong>{" "}
              to rewrite just that section without touching the rest
            </li>
            <li>
              Use <strong>Continue mode</strong> after writing your introduction
              — having the AI continue feels more natural than generating
              everything from scratch
            </li>
            <li>
              Use the <strong>prompt history</strong> to quickly re-run a
              previous prompt with a different tone or mode
            </li>
            <li>
              Write your content first, then click <strong>✨ Suggest</strong>{" "}
              for title and tags
            </li>
            <li>
              If a generation goes wrong, press{" "}
              <code className="text-sm bg-secondary px-2 py-1 rounded">
                Ctrl + Z
              </code>{" "}
              while the panel is open to restore your previous content
            </li>
            <li>
              Use <strong>Stop</strong> early if the AI starts going off-topic —
              partial content is saved and you can refine from there
            </li>
          </ul>
        </section>

        <hr className="my-8 border-border" />

        {/* ── FOOTER ──────────────────────────────────────────────────────── */}
        <div className="text-center py-8">
          <p className="text-2xl font-semibold mb-3">
            Write smarter, not harder ✨
          </p>
          <p className="text-muted-foreground text-base leading-relaxed">
            Markdown keeps your formatting clean. AI keeps your writing fast.
            Together they make your solutions clearer, more professional, and
            easier to understand for others. Happy coding 🚀
          </p>
        </div>
        <div ref={spacerRef} aria-hidden="true" />
      </div>
    </div>
  );
};

export default MarkdownGuideBox;
