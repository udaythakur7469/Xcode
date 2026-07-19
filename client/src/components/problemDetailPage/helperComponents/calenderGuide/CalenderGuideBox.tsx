"use client";

import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";

type CalendarGuideBoxProps = {};

const SECTIONS = [
  { id: "single-vs-range", label: "🔀 Single vs Range Mode" },
  { id: "heatmap-colors", label: "🟩 Heatmap Colors" },
  { id: "date-dots", label: "🟡 The Dots Under a Date" },
  { id: "single-analytics", label: "📅 Panel — Single Date" },
  { id: "range-analytics", label: "📊 Panel — Date Range" },
  { id: "faq", label: "❓ FAQ" },
];

const CalendarGuideBox: React.FC<CalendarGuideBoxProps> = () => {
  const contentRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState("single-vs-range");

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
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible.length > 0) {
          setActiveSection(visible[0].target.id);
        }
      },
      {
        root: container,
        rootMargin: "0px 0px -60% 0px",
        threshold: 0,
      },
    );

    sectionEls.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

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

              <nav
                ref={navRef}
                className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5 scrollbar-transparent"
              >
                {SECTIONS.map((s) => (
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
          Calendar & Analytics Panel Guide
        </h1>

        <p className="text-muted-foreground mb-6 leading-relaxed text-base">
          The <strong>Problem Calendar</strong> on the Problems page is a
          heatmap of your solving activity. Click a single date, or drag across
          a range of dates, to open the <strong>Analytics Panel</strong> next to
          it with a full breakdown of that period. Use the index on the left to
          jump to any section instantly.
        </p>

        <div className="bg-secondary/50 border border-border rounded-md px-5 py-4 mb-10">
          <p className="text-sm font-semibold mb-2">💡 Pro tip</p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Click the same date twice, or click the Analytics Panel&apos;s{" "}
            <strong>close (✕)</strong> button, to clear your current selection
            at any time.
          </p>
        </div>

        <hr className="my-8 border-border" />

        {/* ── SINGLE VS RANGE ─────────────────────────────────────────────── */}
        <section id="single-vs-range" className="mb-12">
          <h2 className="text-3xl font-semibold mb-6 flex items-center gap-3">
            <span className="text-2xl">🔀</span> Single vs Range Mode
          </h2>
          <p className="text-muted-foreground mb-4 text-base leading-relaxed">
            The toggle above the calendar switches between two independent
            selection modes. Switching modes always clears whatever was
            previously selected and closes the Analytics Panel.
          </p>
          <div className="bg-secondary/50 border border-border p-4 rounded-md mb-4">
            <ul className="list-disc list-outside ml-5 text-sm text-muted-foreground space-y-2">
              <li>
                <strong className="text-foreground">Single</strong> — click one
                date to see everything that happened on that specific day.
                Clicking the currently-selected date again deselects it and
                closes the panel.
              </li>
              <li>
                <strong className="text-foreground">Range</strong> — click a
                start date, then click an end date, to see aggregated stats
                across that whole span. The panel only opens once{" "}
                <strong>both</strong> ends of the range are picked — picking
                just a start date won&apos;t open it yet.
              </li>
            </ul>
          </div>
          <p className="text-muted-foreground text-base leading-relaxed">
            Navigating between months with the calendar&apos;s arrows never
            clears your current selection or closes the panel — only switching
            Single/Range mode, re-clicking the selected date, or hitting close
            does that.
          </p>
        </section>

        <hr className="my-8 border-border" />

        {/* ── HEATMAP COLORS ──────────────────────────────────────────────── */}
        <section id="heatmap-colors" className="mb-12">
          <h2 className="text-3xl font-semibold mb-6 flex items-center gap-3">
            <span className="text-2xl">🟩</span> What the Green Shade Means
          </h2>
          <p className="text-muted-foreground mb-4 text-base leading-relaxed">
            Every date in the current month is shaded green based on how many
            problems you solved that day — more problems solved, more intense
            the shade. The legend below the calendar shows this exact scale.
          </p>
          <div className="bg-secondary/50 border border-border p-4 rounded-md mb-4">
            <ul className="list-disc list-outside ml-5 text-sm text-muted-foreground space-y-1.5">
              <li>
                <strong className="text-foreground">No shade</strong> — 0
                problems solved that day
              </li>
              <li>
                <strong className="text-foreground">Faintest green</strong> —
                1–2 problems solved
              </li>
              <li>
                <strong className="text-foreground">Light green</strong> — 3–5
                problems solved
              </li>
              <li>
                <strong className="text-foreground">Medium green</strong> — 6–8
                problems solved
              </li>
              <li>
                <strong className="text-foreground">
                  Darkest green (white text)
                </strong>{" "}
                — 9 or more problems solved
              </li>
            </ul>
          </div>
          <p className="text-muted-foreground text-base leading-relaxed">
            Dates greyed out at the edges of the grid belong to the
            previous/next month — they&apos;re never shaded and exist only to
            fill out the calendar grid.
          </p>
        </section>

        <hr className="my-8 border-border" />

        {/* ── DOTS UNDER A DATE ────────────────────────────────────────────── */}
        <section id="date-dots" className="mb-12">
          <h2 className="text-3xl font-semibold mb-6 flex items-center gap-3">
            <span className="text-2xl">🟡</span> The Dots Under a Date
          </h2>
          <p className="text-muted-foreground mb-4 text-base leading-relaxed">
            Independent of the green heat shade, a date can also show one or two
            small dots underneath its number:
          </p>
          <div className="bg-secondary/50 border border-border p-4 rounded-md mb-4">
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <span className="block h-[6px] w-[6px] rounded-full bg-yellow-400 shrink-0" />
                <span>
                  <strong className="text-foreground">Yellow dot</strong> — you
                  solved the <strong>Problem of the Day</strong> on that date
                </span>
              </li>
              <li className="flex items-center gap-2">
                <span className="block h-[6px] w-[6px] rounded-full bg-blue-400 shrink-0" />
                <span>
                  <strong className="text-foreground">Blue dot</strong> — a{" "}
                  <strong>spaced-repetition revision</strong> is scheduled to be
                  due on that date
                </span>
              </li>
            </ul>
          </div>
          <p className="text-muted-foreground text-base leading-relaxed">
            Hovering over any shaded date shows a tooltip spelling out the exact
            count and which of these apply — you don&apos;t have to memorize the
            colors, the tooltip always confirms it.
          </p>
        </section>

        <hr className="my-8 border-border" />

        {/* ── SINGLE-DATE ANALYTICS PANEL ──────────────────────────────────── */}
        <section id="single-analytics" className="mb-12">
          <h2 className="text-3xl font-semibold mb-6 flex items-center gap-3">
            <span className="text-2xl">📅</span> The Analytics Panel — Single
            Date
          </h2>
          <p className="text-muted-foreground mb-4 text-base leading-relaxed">
            Selecting one date in Single mode opens a panel with everything
            tracked for that specific day:
          </p>
          <div className="bg-secondary/50 border border-border p-4 rounded-md mb-4">
            <ul className="list-disc list-outside ml-5 text-sm text-muted-foreground space-y-1.5">
              <li>
                <strong className="text-foreground">Solved</strong> and{" "}
                <strong className="text-foreground">Attempted</strong> counts
                for that day
              </li>
              <li>
                <strong className="text-foreground">Coding Time</strong> — total
                time spent in the code editor that day
              </li>
              <li>
                <strong className="text-foreground">POTD</strong> — whether you
                solved the Problem of the Day
              </li>
              <li>
                A{" "}
                <strong className="text-foreground">
                  Difficulty Breakdown
                </strong>{" "}
                bar chart (Easy / Medium / Hard) for problems solved that day
              </li>
              <li>
                A list of every{" "}
                <strong className="text-foreground">Solved Problem</strong> —
                click any one to jump straight to it
              </li>
              <li>
                A <strong className="text-foreground">Revision Due</strong>{" "}
                list, if any revisions were scheduled for that date
              </li>
            </ul>
          </div>
        </section>

        <hr className="my-8 border-border" />

        {/* ── RANGE ANALYTICS PANEL ────────────────────────────────────────── */}
        <section id="range-analytics" className="mb-12">
          <h2 className="text-3xl font-semibold mb-6 flex items-center gap-3">
            <span className="text-2xl">📊</span> The Analytics Panel — Date
            Range
          </h2>
          <p className="text-muted-foreground mb-4 text-base leading-relaxed">
            Picking a start and end date in Range mode instead opens an
            aggregated view across the whole span:
          </p>
          <div className="bg-secondary/50 border border-border p-4 rounded-md mb-4">
            <ul className="list-disc list-outside ml-5 text-sm text-muted-foreground space-y-1.5">
              <li>
                <strong className="text-foreground">Total Solved</strong> and{" "}
                <strong className="text-foreground">Attempted</strong> across
                the whole range
              </li>
              <li>
                <strong className="text-foreground">Daily Avg</strong> — average
                problems solved per day over the range
              </li>
              <li>
                <strong className="text-foreground">Most Active</strong> — the
                single day with the most problems solved in the range
              </li>
              <li>
                The same{" "}
                <strong className="text-foreground">
                  Difficulty Breakdown
                </strong>{" "}
                bar chart, totaled across the whole range
              </li>
              <li>
                <strong className="text-foreground">Topic Distribution</strong>{" "}
                — chips showing which topics/tags came up most across the
                problems you solved in the range
              </li>
              <li>
                The full list of{" "}
                <strong className="text-foreground">Problems Solved</strong> in
                the range, each showing which date it was solved on — click any
                one to jump straight to it
              </li>
            </ul>
          </div>
        </section>

        <hr className="my-8 border-border" />

        {/* ── FAQ ──────────────────────────────────────────────────────────── */}
        <section id="faq" className="mb-12">
          <h2 className="text-3xl font-semibold mb-6 flex items-center gap-3">
            <span className="text-2xl">❓</span> FAQ
          </h2>

          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-2">
              Why is a date I know I solved problems on not shaded at all?
            </h3>
            <p className="text-muted-foreground text-base leading-relaxed">
              Only dates within the currently displayed month are shaded —
              navigate to that month using the calendar&apos;s arrows and it
              will show its heat shade correctly.
            </p>
          </div>

          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-2">
              I selected a range but the panel didn&apos;t open — why?
            </h3>
            <p className="text-muted-foreground text-base leading-relaxed">
              The panel only opens once <strong>both</strong> a start and an end
              date are picked. If you&apos;ve only clicked one date so far in
              Range mode, click a second date to complete the range.
            </p>
          </div>

          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-2">
              Does switching months lose my current selection?
            </h3>
            <p className="text-muted-foreground text-base leading-relaxed">
              No — browsing between months keeps your selected date/range and
              the Analytics Panel open exactly as they were.
            </p>
          </div>
        </section>

        {/* ── FOOTER ──────────────────────────────────────────────────────── */}
        <div className="text-center py-8">
          <p className="text-2xl font-semibold mb-3">
            Your activity, at a glance 📅
          </p>
          <p className="text-muted-foreground text-base leading-relaxed">
            The calendar shows you what happened. The Analytics Panel shows you
            why it matters. Together they turn raw solving activity into a clear
            picture of your progress. Happy tracking 🚀
          </p>
        </div>
        <div aria-hidden="true" className="h-[50vh]" />
      </div>
    </div>
  );
};

export default CalendarGuideBox;
