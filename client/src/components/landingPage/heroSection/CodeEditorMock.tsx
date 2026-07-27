"use client";

import React from "react";
import { motion } from "framer-motion";

const CodeEditorMock: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, rotateY: -10 }}
      animate={{ opacity: 1, y: 0, rotateY: -6 }}
      whileHover={{ rotateY: -2, rotateX: 1 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      style={{ transformPerspective: 1200 }}
      className="rounded-xl border border-border bg-card overflow-hidden shadow-2xl"
    >
      {/* Title bar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-secondary">
        <span className="w-[11px] h-[11px] rounded-full bg-[#ff5f57]" />
        <span className="w-[11px] h-[11px] rounded-full bg-[#febc2e]" />
        <span className="w-[11px] h-[11px] rounded-full bg-[#28c840]" />
        <span className="ml-2 font-mono text-xs text-muted-foreground">
          two-sum.cpp
        </span>
      </div>

      {/* Code body — scrollable both ways, scrollbar visually transparent */}
      <div className="flex font-mono text-[0.82rem] leading-[1.9] max-h-[280px] overflow-y-auto scrollbar-transparent">
        <div className="px-3 py-[18px] text-right text-muted-foreground/50 select-none border-r border-border shrink-0">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>
        <div className="px-5 py-[18px] whitespace-pre overflow-x-auto flex-1 scrollbar-transparent">
          <span className="text-muted-foreground">
            {"// runtime: O(n)  memory: O(n)"}
          </span>
          {"\n"}
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
          {"\n    "}
          <span className="text-[#ff7ab2]">unordered_map</span>
          {"<"}
          <span className="text-[#ff7ab2]">int</span>
          {","}
          <span className="text-[#ff7ab2]">int</span>
          {"> seen;"}
          {"\n    "}
          <span className="text-[#ff7ab2]">for</span>
          {" ("}
          <span className="text-[#ff7ab2]">int</span>
          {" i = "}
          <span className="text-[#e0af68]">0</span>
          {"; i < nums.size(); i++) {"}
          {"\n        "}
          <span className="text-[#ff7ab2]">int</span>
          {" need = target - nums[i];"}
          {"\n        "}
          <span className="text-[#ff7ab2]">if</span>
          {" (seen.count(need))"}
          {"\n            "}
          <span className="text-[#ff7ab2]">return</span>
          {" {seen[need], i};"}
          {"\n        seen[nums[i]] = i;"}
          {"\n    }"}
          {"\n    "}
          <span className="text-[#ff7ab2]">return</span>
          {" {};"}
          {"\n}"}
          <span className="inline-block w-[2px] h-[1em] align-middle bg-brand animate-blink-cursor" />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-[18px] py-3 border-t border-border font-mono text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5 text-[#4ade80]">
          <span className="text-[0.6rem]">●</span> All 47 test cases passed
        </span>
        <span>runtime beats 94.2%</span>
      </div>
    </motion.div>
  );
};

export default CodeEditorMock;
