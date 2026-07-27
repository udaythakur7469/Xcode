"use client";

import React, { useMemo } from "react";

const PanelShell: React.FC<{ filename: string; children: React.ReactNode }> = ({
  filename,
  children,
}) => (
  <div className="rounded-xl border border-border bg-card overflow-hidden shadow-lg">
    <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-secondary">
      <span className="w-[11px] h-[11px] rounded-full bg-[#ff5f57]" />
      <span className="w-[11px] h-[11px] rounded-full bg-[#febc2e]" />
      <span className="w-[11px] h-[11px] rounded-full bg-[#28c840]" />
      <span className="ml-2 font-mono text-xs text-muted-foreground">
        {filename}
      </span>
    </div>
    {children}
  </div>
);

const DIFFICULTY_COLORS: Record<string, string> = {
  Easy: "#4ade80",
  Medium: "#f59e0b",
  Hard: "#ef4444",
};

export const ProblemListPreview: React.FC = () => {
  const rows = [
    { name: "1. Two Sum", difficulty: "Easy" },
    { name: "2. Longest Substring", difficulty: "Medium" },
    { name: "3. Merge K Sorted Lists", difficulty: "Hard" },
    { name: "4. Valid Parentheses", difficulty: "Easy" },
  ];
  return (
    <PanelShell filename="Problem List">
      <div className="px-5 py-3 text-[0.85rem]">
        {rows.map((row, index) => (
          <div
            key={row.name}
            className={`flex justify-between py-2.5 ${
              index !== rows.length - 1 ? "border-b border-border" : ""
            }`}
          >
            <span>{row.name}</span>
            <span
              className="font-mono text-xs"
              style={{ color: DIFFICULTY_COLORS[row.difficulty] }}
            >
              {row.difficulty}
            </span>
          </div>
        ))}
      </div>
    </PanelShell>
  );
};

const CODE_LANGS = ["C++", "Java", "Python", "JavaScript"];

export const CodeEditorPreview: React.FC = () => {
  return (
    <PanelShell filename="two-sum.cpp">
      <div className="flex gap-2 px-3.5 py-2.5 border-b border-border bg-secondary">
        {CODE_LANGS.map((lang, index) => (
          <span
            key={lang}
            className={`font-mono text-xs px-3 py-1.5 rounded-md ${
              index === 0
                ? "bg-brand text-white"
                : "text-muted-foreground"
            }`}
          >
            {lang}
          </span>
        ))}
      </div>
      <div className="px-5 py-[18px] font-mono text-[0.8rem] leading-[1.9] max-h-[280px] overflow-y-auto scrollbar-transparent">
        <span className="text-muted-foreground">
          // runtime: O(n)  memory: O(n)
        </span>
        <br />
        <span className="text-[#ff7ab2]">vector</span>
        {"<"}
        <span className="text-[#ff7ab2]">int</span>
        {"> "}
        <span className="text-[#4f9dff]">twoSum</span>
        {"("}
        <span className="text-[#ff7ab2]">vector</span>
        {"<"}
        <span className="text-[#ff7ab2]">int</span>
        {">& nums, "}
        <span className="text-[#ff7ab2]">int</span>
        {" target) {"}
        <br />
        &nbsp;&nbsp;&nbsp;&nbsp;
        <span className="text-[#ff7ab2]">unordered_map</span>
        {"<"}
        <span className="text-[#ff7ab2]">int</span>
        {","}
        <span className="text-[#ff7ab2]">int</span>
        {"> seen;"}
        <br />
        &nbsp;&nbsp;&nbsp;&nbsp;
        <span className="text-[#ff7ab2]">for</span>
        {" ("}
        <span className="text-[#ff7ab2]">int</span>
        {" i = "}
        <span className="text-[#e0af68]">0</span>
        {"; i < nums.size(); i++) {"}
        <br />
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
        <span className="text-[#ff7ab2]">if</span>
        {" (seen.count(target - nums[i])) "}
        <span className="text-[#ff7ab2]">return</span>
        {" {seen[target-nums[i]], i};"}
        <br />
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;seen[nums[i]] = i;
        <br />
        &nbsp;&nbsp;&nbsp;&nbsp;{"}"}
        <br />
        &nbsp;&nbsp;&nbsp;&nbsp;
        <span className="text-[#ff7ab2]">return</span>
        {" {};"}
        <br />
        {"}"}
        <span className="inline-block w-[2px] h-[1em] align-middle bg-brand animate-blink-cursor" />
      </div>
    </PanelShell>
  );
};

export const VerdictBreakdownPreview: React.FC = () => {
  const rows = [
    { label: "Test Case 1", value: "Accepted", pass: true },
    { label: "Test Case 2", value: "Accepted", pass: true },
    { label: "Test Case 3", value: "Wrong Answer", pass: false },
    { label: "Runtime", value: "42ms", pass: null },
    { label: "Memory", value: "14.2MB", pass: null },
  ];
  return (
    <PanelShell filename="Submission Result">
      <div className="px-5 py-1">
        {rows.map((row, index) => (
          <div
            key={row.label}
            className={`flex justify-between py-2.5 text-[0.85rem] ${
              index !== rows.length - 1 ? "border-b border-border" : ""
            }`}
          >
            <span>{row.label}</span>
            <span
              className={
                row.pass === true
                  ? "text-[#4ade80] font-mono text-xs"
                  : row.pass === false
                  ? "text-[#ef4444] font-mono text-xs"
                  : "font-mono text-xs"
              }
            >
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </PanelShell>
  );
};

export const InterviewPreview: React.FC = () => {
  return (
    <div className="border border-border rounded-xl bg-card p-7 text-center">
      <div className="flex items-center justify-center gap-1 h-[60px] mb-5">
        {Array.from({ length: 7 }).map((_, i) => (
          <span
            key={i}
            className="w-1 rounded-[3px] bg-brand animate-interview-wave"
            style={{ animationDelay: `${i * 0.1}s` }}
          />
        ))}
      </div>
      <div className="text-[0.95rem] p-4 rounded-lg bg-secondary mb-4">
        &quot;Can you walk me through how you&apos;d approach finding the
        longest palindromic substring?&quot;
      </div>
      <div className="font-mono text-xs text-brand flex items-center justify-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse-dot" />
        Interview in progress — 04:32
      </div>
    </div>
  );
};

const NOVA_MESSAGES = [
  { from: "user", text: "Why is my solution getting TLE on large inputs?" },
  {
    from: "nova",
    text: "Your nested loop makes this O(n²). Try using a hash map to check complements in a single pass — that gets you to O(n).",
  },
  { from: "user", text: "Can you point to where exactly?" },
];

export const NovaChatPreview: React.FC = () => {
  return (
    <PanelShell filename="Nova AI Assistant">
      <div className="px-5 py-[18px] flex flex-col gap-3.5 max-h-[280px] overflow-y-auto scrollbar-transparent">
        {NOVA_MESSAGES.map((msg, index) => (
          <div
            key={index}
            className={`max-w-[82%] px-4 py-3 rounded-xl text-[0.88rem] leading-relaxed ${
              msg.from === "user"
                ? "self-end bg-brand text-white rounded-br-[4px]"
                : "self-start bg-secondary rounded-bl-[4px]"
            }`}
          >
            {msg.text}
          </div>
        ))}
        <div className="self-start flex gap-1 bg-secondary px-4 py-3.5 rounded-xl rounded-bl-[4px]">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </PanelShell>
  );
};

export const RevisionQueuePreview: React.FC = () => {
  const items = [
    { name: "Merge Intervals", due: "Due today" },
    { name: "Course Schedule II", due: "Due in 2 days" },
    { name: "LRU Cache", due: "Due in 5 days" },
  ];
  return (
    <PanelShell filename="Revision Queue">
      <div className="flex flex-col gap-2.5 p-5">
        {items.map((item) => (
          <div
            key={item.name}
            className="flex items-center justify-between px-4 py-3.5 rounded-lg bg-secondary"
          >
            <span className="text-[0.9rem] font-semibold">{item.name}</span>
            <span className="font-mono text-xs text-brand bg-brand-muted px-2.5 py-1 rounded-full">
              {item.due}
            </span>
          </div>
        ))}
      </div>
    </PanelShell>
  );
};

export const DiscussionPreview: React.FC = () => {
  const threads = [
    {
      name: "Karan M.",
      text: "Used a hash map instead of brute force — got it down to O(n).",
      meta: "12 upvotes · 3 replies",
    },
    {
      name: "Priya S.",
      text: "Careful with duplicate values in the array — this edge case tripped me up.",
      meta: "8 upvotes · 1 reply",
    },
  ];
  return (
    <PanelShell filename="Discussion — Two Sum">
      <div>
        {threads.map((thread, index) => (
          <div
            key={thread.name}
            className={`flex gap-3 p-4 ${
              index !== threads.length - 1 ? "border-b border-border" : ""
            }`}
          >
            <div className="w-[34px] h-[34px] rounded-full bg-brand flex items-center justify-center text-white font-bold text-xs shrink-0">
              {thread.name.charAt(0)}
            </div>
            <div>
              <div className="text-sm font-semibold">{thread.name}</div>
              <div className="text-sm text-muted-foreground mt-1 leading-relaxed">
                {thread.text}
              </div>
              <div className="font-mono text-[0.72rem] text-muted-foreground mt-1.5">
                {thread.meta}
              </div>
            </div>
          </div>
        ))}
      </div>
    </PanelShell>
  );
};

const ANALYTICS_LEVEL_CLASSES = [
  "heatmap-l0",
  "heatmap-l1",
  "heatmap-l2",
  "heatmap-l3",
  "heatmap-l4",
];

export const AnalyticsPreview: React.FC = () => {
  const cells = useMemo(() => {
    return Array.from({ length: 168 }, (_, i) => {
      const pseudoRandom = Math.abs(Math.sin(i * 12.9898) * 43758.5453) % 1;
      if (pseudoRandom < 0.3) return 0;
      if (pseudoRandom < 0.55) return 1;
      if (pseudoRandom < 0.78) return 2;
      if (pseudoRandom < 0.92) return 3;
      return 4;
    });
  }, []);

  return (
    <div className="border border-border rounded-xl bg-card p-6">
      <div className="grid grid-cols-[repeat(24,1fr)] gap-1">
        {cells.map((level, index) => (
          <div
            key={index}
            className={`aspect-square rounded-sm ${ANALYTICS_LEVEL_CLASSES[level]}`}
          />
        ))}
      </div>
      <div className="flex gap-5 mt-5 flex-wrap">
        {[
          { num: "47", label: "Day streak" },
          { num: "312", label: "Problems solved" },
          { num: "89%", label: "Acceptance rate" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="flex-1 min-w-[120px] text-center py-3.5 rounded-lg bg-secondary"
          >
            <div className="font-mono font-bold text-[1.3rem] text-brand">
              {stat.num}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
