"use client";

import React, { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

type RevisionGuideBoxProps = {};

const SECTIONS = [
  { id: "overview", label: "🧠 What This Is" },
  { id: "how-added", label: "➕ Getting Added to the Queue" },
  { id: "schedule", label: "📅 The 1 / 7 / 30 Day Schedule" },
  { id: "queue-widget", label: "📋 The Revision Queue Widget" },
  { id: "due-labels", label: "🏷️ Due Labels Explained" },
  { id: "mark-done", label: "✅ Mark Revision as Done" },
  { id: "multiple-solves", label: "🔁 Solving the Same Problem Again" },
  { id: "timezone", label: "🌍 Your Local Time, Always" },
  { id: "best-practices", label: "⭐ Getting the Most Out of It" },
  { id: "faq", label: "❓ FAQ" },
];

const RevisionGuideBox: React.FC<RevisionGuideBoxProps> = () => {
  const contentRef = useRef<HTMLDivElement>(null);
  const spacerRef = useRef<HTMLDivElement>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState("overview");

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

              <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5 scrollbar-transparent">
                {SECTIONS.map((s) => (
                  <button
                    key={s.id}
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
          Smart Revision Queue Guide
        </h1>

        <p className="text-muted-foreground mb-6 leading-relaxed text-base">
          The <strong>Revision Queue</strong> is a spaced-repetition system
          built to help you actually remember how to solve problems — not just
          recognize them. It automatically reminds you to revisit problems at
          the exact points where you&apos;re most likely to forget the approach,
          so the solution moves into long-term memory instead of fading a week
          later.
        </p>

        <div className="bg-secondary/50 border border-border rounded-md px-5 py-4 mb-10">
          <p className="text-sm font-semibold mb-2">💡 Why this matters</p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Solving a problem once tells you almost nothing about whether
            you&apos;ll remember it in an interview a month later. Spaced
            repetition — reviewing at increasing intervals — is one of the most
            well-studied ways to move something from short-term to long-term
            memory. This feature does that scheduling for you, automatically, in
            the background.
          </p>
        </div>

        <hr className="my-8 border-border" />

        {/* ── OVERVIEW ─────────────────────────────────────────────────── */}
        <section id="overview" className="mb-12">
          <h2 className="text-3xl font-semibold mb-6 flex items-center gap-3">
            <span className="text-2xl">🧠</span> What This Is
          </h2>
          <p className="text-muted-foreground mb-4 text-base leading-relaxed">
            Every time you get an <strong>Accepted</strong> submission on a
            problem, the system quietly schedules three future check-ins for
            that problem — at <strong>1 day</strong>, <strong>7 days</strong>,
            and <strong>30 days</strong> later. When one of those dates arrives,
            the problem shows up in your <strong>Revision Queue</strong> on the
            Problems page, waiting for you to revisit it.
          </p>
          <p className="text-muted-foreground text-base leading-relaxed">
            You don&apos;t have to set anything up or remember to schedule
            reviews yourself — solving a problem is the only action required.
            The system handles the rest.
          </p>
        </section>

        <hr className="my-8 border-border" />

        {/* ── HOW ADDED ────────────────────────────────────────────────── */}
        <section id="how-added" className="mb-12">
          <h2 className="text-3xl font-semibold mb-6 flex items-center gap-3">
            <span className="text-2xl">➕</span> Getting Added to the Queue
          </h2>
          <p className="text-muted-foreground mb-4 text-base leading-relaxed">
            <strong>What triggers it:</strong> Submitting a solution that gets
            an <strong>Accepted</strong> verdict. Wrong Answer, Time Limit
            Exceeded, Runtime Error, and other non-accepted verdicts do not add
            anything to your queue.
          </p>
          <div className="bg-secondary/50 border border-border p-4 rounded-md mb-4">
            <p className="text-sm text-muted-foreground mb-2 font-semibold">
              The moment you get Accepted:
            </p>
            <ol className="list-decimal list-outside ml-5 text-sm text-muted-foreground space-y-1.5">
              <li>The problem is marked as solved on your profile</li>
              <li>
                Three revision check-ins are scheduled: 1 day, 7 days, and 30
                days from right now
              </li>
              <li>
                Nothing appears in your queue immediately — the earliest
                check-in isn&apos;t due until tomorrow
              </li>
            </ol>
          </div>
          <p className="text-muted-foreground text-base leading-relaxed">
            <strong>This is expected behavior, not a bug:</strong> if you solve
            a problem right now, it will not show up in your Revision Queue
            until roughly 24 hours have passed. That gap is the whole point —
            reviewing something the same minute you solved it doesn&apos;t test
            your memory at all.
          </p>
        </section>

        <hr className="my-8 border-border" />

        {/* ── SCHEDULE ─────────────────────────────────────────────────── */}
        <section id="schedule" className="mb-12">
          <h2 className="text-3xl font-semibold mb-6 flex items-center gap-3">
            <span className="text-2xl">📅</span> The 1 / 7 / 30 Day Schedule
          </h2>
          <p className="text-muted-foreground mb-6 text-base leading-relaxed">
            Each solved problem gets exactly three check-ins, spaced further and
            further apart. Each interval targets a different kind of forgetting:
          </p>

          <div className="mb-8">
            <h3 className="text-2xl font-semibold mb-4">
              Day 1{" "}
              <span className="text-base font-normal text-muted-foreground">
                — Lock it in
              </span>
            </h3>
            <p className="text-muted-foreground text-base leading-relaxed">
              This is where most of the forgetting happens if left unchecked —
              the first 24–48 hours after learning something new. Reviewing here
              catches the approach while it&apos;s still fresh and turns a shaky
              first solve into something you can reproduce on demand.
            </p>
          </div>

          <div className="mb-8">
            <h3 className="text-2xl font-semibold mb-4">
              Day 7{" "}
              <span className="text-base font-normal text-muted-foreground">
                — Confirm it stuck
              </span>
            </h3>
            <p className="text-muted-foreground text-base leading-relaxed">
              A week later, without the problem fresh in your mind, this
              check-in tests whether you actually internalized the pattern or
              just remembered it short-term. This is usually the revision that
              reveals whether you truly understand the technique (e.g. sliding
              window, DP transition) or only memorized that specific problem.
            </p>
          </div>

          <div className="mb-8">
            <h3 className="text-2xl font-semibold mb-4">
              Day 30{" "}
              <span className="text-base font-normal text-muted-foreground">
                — Make it permanent
              </span>
            </h3>
            <p className="text-muted-foreground text-base leading-relaxed">
              A month out, this final check-in is what pushes the solution from
              &quot;I remember reviewing this&quot; into genuine long-term
              retention — the kind that shows up reliably in a live interview
              weeks or months from now.
            </p>
          </div>

          <div className="bg-secondary/50 border border-border px-5 py-4 rounded-md">
            <p className="text-sm font-semibold mb-2">💡 Note</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              All three check-ins are scheduled at once, the moment you get
              Accepted — you don&apos;t need to do anything to set them up.
            </p>
          </div>
        </section>

        <hr className="my-8 border-border" />

        {/* ── QUEUE WIDGET ─────────────────────────────────────────────── */}
        <section id="queue-widget" className="mb-12">
          <h2 className="text-3xl font-semibold mb-6 flex items-center gap-3">
            <span className="text-2xl">📋</span> The Revision Queue Widget
          </h2>
          <p className="text-muted-foreground mb-4 text-base leading-relaxed">
            <strong>Where to find it:</strong> On the{" "}
            <strong>Problems page</strong>, in the analytics panel. It shows up
            to <strong>10 problems</strong> at a time — whichever check-ins are
            currently due, ordered by how overdue they are (most overdue first).
          </p>
          <div className="bg-secondary/50 border border-border p-4 rounded-md mb-4">
            <ul className="list-disc list-outside ml-5 text-sm text-muted-foreground space-y-1.5">
              <li>
                Each entry shows the problem title, its difficulty, and a{" "}
                <strong>due label</strong> (see below)
              </li>
              <li>Clicking an entry takes you straight to that problem</li>
              <li>
                Only shows what&apos;s actually due right now — future check-ins
                stay hidden until their date arrives
              </li>
              <li>
                If nothing is due, the widget simply doesn&apos;t show —
                that&apos;s a sign you&apos;re caught up, not a sign
                something&apos;s broken
              </li>
            </ul>
          </div>
          <p className="text-muted-foreground text-base leading-relaxed">
            <strong>One entry per problem:</strong> even if a problem has
            multiple check-ins due (say you fell behind and both its 7-day and
            30-day reviews are now overdue), it only occupies{" "}
            <strong>one</strong> slot in the queue — the earliest due check-in
            for that problem. Solving all your other pending problems takes
            priority over seeing duplicates of the same one.
          </p>
        </section>

        <hr className="my-8 border-border" />

        {/* ── DUE LABELS ───────────────────────────────────────────────── */}
        <section id="due-labels" className="mb-12">
          <h2 className="text-3xl font-semibold mb-6 flex items-center gap-3">
            <span className="text-2xl">🏷️</span> Due Labels Explained
          </h2>
          <p className="text-muted-foreground mb-6 text-base leading-relaxed">
            Every item in the queue shows exactly where it stands relative to
            today:
          </p>
          <div className="bg-secondary/50 border border-border p-4 rounded-md mb-4">
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li>
                <strong className="text-foreground">Due today</strong> — The
                check-in date is today. This is the ideal time to review it.
              </li>
              <li>
                <strong className="text-foreground">Due tomorrow</strong> —
                Coming up next; not yet actionable, shown so you know
                what&apos;s ahead.
              </li>
              <li>
                <strong className="text-foreground">Due yesterday</strong> /{" "}
                <strong className="text-foreground">Due N days ago</strong> —
                You&apos;ve fallen a bit behind. These are flagged as{" "}
                <strong>overdue</strong> and sorted to the top of the queue so
                you clear them first.
              </li>
              <li>
                <strong className="text-foreground">Due in N days</strong> —
                Scheduled further out; nothing to do yet.
              </li>
            </ul>
          </div>
          <p className="text-muted-foreground text-base leading-relaxed">
            <strong>Overdue items don&apos;t expire or disappear.</strong> If
            you don&apos;t get to a check-in on its exact due date, it simply
            stays in the queue — getting more &quot;overdue&quot; — until you
            review it. There&apos;s no penalty beyond that; take your time.
          </p>
        </section>

        <hr className="my-8 border-border" />

        {/* ── MARK AS DONE ─────────────────────────────────────────────── */}
        <section id="mark-done" className="mb-12">
          <h2 className="text-3xl font-semibold mb-6 flex items-center gap-3">
            <span className="text-2xl">✅</span> Mark Revision as Done
          </h2>
          <p className="text-muted-foreground mb-4 text-base leading-relaxed">
            <strong>Where it appears:</strong> On a problem&apos;s detail page,
            but <strong>only</strong> when that problem currently has a check-in
            due — this button is intentionally hidden the rest of the time so it
            doesn&apos;t clutter problems you&apos;re not due to revisit yet.
          </p>
          <div className="bg-secondary/50 border border-border p-4 rounded-md mb-4">
            <p className="text-sm text-muted-foreground mb-2 font-semibold">
              How to use it:
            </p>
            <ol className="list-decimal list-outside ml-5 text-sm text-muted-foreground space-y-1.5">
              <li>
                Open a problem that appears in your Revision Queue (either by
                clicking it from the widget, or navigating there directly)
              </li>
              <li>
                Re-attempt it — ideally without looking at your old solution
                first, to genuinely test recall
              </li>
              <li>
                Get an <strong>Accepted</strong> submission during this session
              </li>
              <li>
                Click <strong>Mark Revision as Done</strong> to clear this
                check-in
              </li>
            </ol>
          </div>
          <div className="bg-secondary/50 border border-border px-5 py-4 rounded-md mb-4">
            <p className="text-sm font-semibold mb-2">⚠️ Important</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              The button stays disabled until you&apos;ve gotten an{" "}
              <strong>Accepted</strong> submission during the current session on
              this problem. This is deliberate — marking a revision done should
              mean you actually re-solved it, not just opened the page and
              clicked a button.
            </p>
          </div>
          <p className="text-muted-foreground text-base leading-relaxed">
            Once marked done, that specific check-in (e.g. the 7-day one) is
            complete and won&apos;t show up again — but the <em>next</em>{" "}
            scheduled check-in for that problem (e.g. the 30-day one) is
            untouched and will still arrive on its own date.
          </p>
        </section>

        <hr className="my-8 border-border" />

        {/* ── MULTIPLE SOLVES ─────────────────────────────────────────── */}
        <section id="multiple-solves" className="mb-12">
          <h2 className="text-3xl font-semibold mb-6 flex items-center gap-3">
            <span className="text-2xl">🔁</span> Solving the Same Problem Again
          </h2>
          <p className="text-muted-foreground mb-4 text-base leading-relaxed">
            If you get Accepted on a problem you&apos;ve already solved before —
            outside of using the <strong>Mark Revision as Done</strong> flow —
            you won&apos;t end up with duplicate or conflicting check-ins piling
            up for the same problem. The system is built to avoid cluttering
            your queue with repeats.
          </p>
          <p className="text-muted-foreground text-base leading-relaxed">
            The cleanest way to clear a due check-in is always through the{" "}
            <strong>Mark Revision as Done</strong> button on that problem&apos;s
            page — it&apos;s the action specifically designed to close out a
            pending revision.
          </p>
        </section>

        <hr className="my-8 border-border" />

        {/* ── TIMEZONE ─────────────────────────────────────────────────── */}
        <section id="timezone" className="mb-12">
          <h2 className="text-3xl font-semibold mb-6 flex items-center gap-3">
            <span className="text-2xl">🌍</span> Your Local Time, Always
          </h2>
          <p className="text-muted-foreground mb-4 text-base leading-relaxed">
            &quot;Due today&quot; is calculated using{" "}
            <strong>your own local calendar day</strong> — wherever you are in
            the world — not a fixed server timezone. Whether you&apos;re in
            India, the US, Europe, or anywhere else, the queue lines up with
            your midnight-to-midnight, not a server&apos;s.
          </p>
          <div className="bg-secondary/50 border border-border px-5 py-4 rounded-md">
            <p className="text-sm font-semibold mb-2">💡 Good to know</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              This is detected automatically from your device — there&apos;s
              nothing to configure. If you travel across timezones, the queue
              simply adjusts to wherever you currently are the next time you
              load the page.
            </p>
          </div>
        </section>

        <hr className="my-8 border-border" />

        {/* ── BEST PRACTICES ──────────────────────────────────────────── */}
        <section id="best-practices" className="mb-12">
          <h2 className="text-3xl font-semibold mb-6 flex items-center gap-3">
            <span className="text-2xl">⭐</span> Getting the Most Out of It
          </h2>
          <ul className="list-disc list-outside ml-6 text-muted-foreground space-y-3 text-base leading-relaxed">
            <li>
              Check your <strong>Revision Queue</strong> at the start of every
              session, before jumping into new problems — clearing due items
              first compounds much better than letting them pile up
            </li>
            <li>
              When you revisit a problem, try to solve it{" "}
              <strong>without looking at your old code first</strong> — the
              whole value of the review is testing unaided recall
            </li>
            <li>
              Don&apos;t stress about overdue items — they wait patiently. A
              late review is still far better than no review
            </li>
            <li>
              If a problem keeps feeling hard even at the 30-day check-in,
              that&apos;s useful signal — it&apos;s telling you the pattern
              genuinely hasn&apos;t stuck yet, not that something&apos;s wrong
              with you
            </li>
            <li>
              Pair this with writing a short solution post (see the Editor
              Guide) right after your Day-1 review — explaining the approach in
              your own words reinforces it even further
            </li>
          </ul>
        </section>

        <hr className="my-8 border-border" />

        {/* ── FAQ ──────────────────────────────────────────────────────── */}
        <section id="faq" className="mb-12">
          <h2 className="text-3xl font-semibold mb-6 flex items-center gap-3">
            <span className="text-2xl">❓</span> FAQ
          </h2>

          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-2">
              I just solved a problem — why isn&apos;t it in my queue?
            </h3>
            <p className="text-muted-foreground text-base leading-relaxed">
              That&apos;s expected. The first check-in is scheduled for{" "}
              <strong>1 day later</strong>, not immediately. Give it about 24
              hours.
            </p>
          </div>

          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-2">
              Can I add a problem to the queue manually?
            </h3>
            <p className="text-muted-foreground text-base leading-relaxed">
              No — the queue is populated automatically from your Accepted
              submissions. There&apos;s no manual &quot;add to revision&quot;
              action, by design, to keep the schedule consistent and
              trustworthy.
            </p>
          </div>

          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-2">
              What happens if I never revisit an overdue problem?
            </h3>
            <p className="text-muted-foreground text-base leading-relaxed">
              Nothing punitive — it just stays visible in your queue, marked as
              overdue, until you either review it or it&apos;s superseded by a
              fresh solve.
            </p>
          </div>

          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-2">
              Does the queue ever run out?
            </h3>
            <p className="text-muted-foreground text-base leading-relaxed">
              It shows up to 10 problems at a time. If you clear all of them, it
              stays empty until your next check-in comes due — a completely
              empty queue is a good sign, not a bug.
            </p>
          </div>
        </section>

        {/* ── FOOTER ──────────────────────────────────────────────────── */}
        <div className="text-center py-8">
          <p className="text-2xl font-semibold mb-3">
            Solving once is practice. Revisiting is what makes it stick 🧠
          </p>
          <p className="text-muted-foreground text-base leading-relaxed">
            The Revision Queue does the scheduling — all you have to do is show
            up when it&apos;s due. Happy revising 🚀
          </p>
        </div>
        <div ref={spacerRef} aria-hidden="true" />
      </div>
    </div>
  );
};

export default RevisionGuideBox;
