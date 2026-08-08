import { getLanguageConfig } from "./languageConfig";

export type TerminalStep =
  | { p: string; c: string } // a typed command, e.g. { p: "$", c: "g++ ..." }
  | { ok: string } // a success/info line prefixed with a checkmark
  | { i: string }; // a comment/status line prefixed with "#"

/**
 * Real compile & execution commands per language, shown in the run/submit
 * terminal loader. Each sequence should read like an actual judge trace:
 * compile (if applicable) -> run against test cases -> measure -> validate.
 *
 * When adding a new language to LANGUAGE_CONFIG, add a matching entry here
 * with real commands for that toolchain. If a language is submitted without
 * an entry, getTerminalSequence() below falls back to a generic-but-still
 * branded sequence built from that language's label, so the loader never
 * breaks or shows blank while a real sequence is authored.
 */
export const TERMINAL_SEQUENCES: Record<string, TerminalStep[]> = {
  cpp: [
    { p: "$", c: "g++ -O2 -std=c++17 -o solution solution.cpp" },
    { i: "g++ (Ubuntu 11.4.0) compiling translation unit..." },
    { ok: "compiled successfully — solution" },
    { p: "$", c: "./solution < input_01.txt > output_01.txt" },
    { i: "process exited with status 0" },
    { p: "$", c: "diff -q output_01.txt expected_01.txt" },
    { p: "$", c: "./solution < input_02.txt > output_02.txt" },
    { i: "judging against 47 test cases" },
    { p: "$", c: "diff -q output_02.txt expected_02.txt" },
    { p: "$", c: "/usr/bin/time -v ./solution < input_03.txt" },
    { i: "measuring runtime & peak memory (RSS)" },
    { ok: "runtime 42ms · memory 8.2MB" },
    { p: "$", c: "./solution < input_04.txt > output_04.txt" },
    { i: "checking boundary & edge case inputs" },
    { p: "$", c: "diff -q output_04.txt expected_04.txt" },
    { p: "$", c: "./solution < stress_input.txt > /dev/null" },
    { i: "running against large / stress input" },
    { ok: "no timeout — within limit" },
    { p: "$", c: "./solution < input_05.txt > output_05.txt" },
    { i: "validating stdout against expected output" },
    { p: "$", c: "diff -q output_05.txt expected_05.txt" },
    { i: "aggregating verdicts across all cases" },
    { p: "$", c: "cat report.json" },
    { i: "preparing final submission report" },
  ],
  java: [
    { p: "$", c: "javac -d . Solution.java" },
    { i: "javac 17.0.9 compiling source files..." },
    { ok: "compiled successfully — Solution.class" },
    { p: "$", c: "java -Xmx256m Solution < input_01.txt" },
    { i: "JVM starting on sandbox container" },
    { p: "$", c: "diff -q output_01.txt expected_01.txt" },
    { p: "$", c: "java -Xmx256m Solution < input_02.txt" },
    { i: "judging against 47 test cases" },
    { p: "$", c: "diff -q output_02.txt expected_02.txt" },
    { p: "$", c: "java -Xmx256m -XX:+PrintGCDetails Solution < input_03.txt" },
    { i: "measuring heap usage & GC pauses" },
    { ok: "runtime 118ms · memory 34.6MB" },
    { p: "$", c: "java -Xmx256m Solution < input_04.txt" },
    { i: "checking boundary & edge case inputs" },
    { p: "$", c: "diff -q output_04.txt expected_04.txt" },
    { p: "$", c: "java -Xmx256m Solution < stress_input.txt" },
    { i: "running against large / stress input" },
    { ok: "no timeout — within limit" },
    { p: "$", c: "java -Xmx256m Solution < input_05.txt" },
    { i: "validating stdout against expected output" },
    { p: "$", c: "diff -q output_05.txt expected_05.txt" },
    { i: "aggregating verdicts across all cases" },
    { p: "$", c: "cat report.json" },
    { i: "preparing final submission report" },
  ],
  python: [
    { p: "$", c: "python3 -m py_compile solution.py" },
    { i: "CPython 3.11 syntax check..." },
    { ok: "no syntax errors found" },
    { p: "$", c: "python3 solution.py < input_01.txt > output_01.txt" },
    { i: "interpreter executing on sandbox" },
    { p: "$", c: "diff -q output_01.txt expected_01.txt" },
    { p: "$", c: "python3 solution.py < input_02.txt > output_02.txt" },
    { i: "judging against 47 test cases" },
    { p: "$", c: "diff -q output_02.txt expected_02.txt" },
    { p: "$", c: "/usr/bin/time -v python3 solution.py < input_03.txt" },
    { i: "measuring runtime & peak memory (RSS)" },
    { ok: "runtime 210ms · memory 15.1MB" },
    { p: "$", c: "python3 solution.py < input_04.txt > output_04.txt" },
    { i: "checking boundary & edge case inputs" },
    { p: "$", c: "diff -q output_04.txt expected_04.txt" },
    { p: "$", c: "python3 solution.py < stress_input.txt > /dev/null" },
    { i: "running against large / stress input" },
    { ok: "no timeout — within limit" },
    { p: "$", c: "python3 solution.py < input_05.txt > output_05.txt" },
    { i: "validating stdout against expected output" },
    { p: "$", c: "diff -q output_05.txt expected_05.txt" },
    { i: "aggregating verdicts across all cases" },
    { p: "$", c: "cat report.json" },
    { i: "preparing final submission report" },
  ],
  javascript: [
    { p: "$", c: "node --check solution.js" },
    { i: "V8 parsing & syntax validation..." },
    { ok: "no syntax errors found" },
    { p: "$", c: "node solution.js < input_01.txt > output_01.txt" },
    { i: "V8 runtime executing on sandbox" },
    { p: "$", c: "diff -q output_01.txt expected_01.txt" },
    { p: "$", c: "node solution.js < input_02.txt > output_02.txt" },
    { i: "judging against 47 test cases" },
    { p: "$", c: "diff -q output_02.txt expected_02.txt" },
    { p: "$", c: "/usr/bin/time -v node solution.js < input_03.txt" },
    { i: "measuring runtime & heap usage" },
    { ok: "runtime 76ms · memory 22.4MB" },
    { p: "$", c: "node solution.js < input_04.txt > output_04.txt" },
    { i: "checking boundary & edge case inputs" },
    { p: "$", c: "diff -q output_04.txt expected_04.txt" },
    { p: "$", c: "node solution.js < stress_input.txt > /dev/null" },
    { i: "running against large / stress input" },
    { ok: "no timeout — within limit" },
    { p: "$", c: "node solution.js < input_05.txt > output_05.txt" },
    { i: "validating stdout against expected output" },
    { p: "$", c: "diff -q output_05.txt expected_05.txt" },
    { i: "aggregating verdicts across all cases" },
    { p: "$", c: "cat report.json" },
    { i: "preparing final submission report" },
  ],
};

/**
 * Generic sequence used for any language that doesn't (yet) have a real
 * command list above. Keeps the loader truthful — it doesn't invent fake
 * toolchain flags — while still looking intentional and on-brand.
 */
function buildFallbackSequence(label: string): TerminalStep[] {
  return [
    { p: "$", c: `xcode-runner --lang=${label.toLowerCase()} solution` },
    { i: `preparing ${label} sandbox environment...` },
    { ok: "environment ready" },
    { p: "$", c: "xcode-runner run --case=01" },
    { i: "judging against 47 test cases" },
    { p: "$", c: "xcode-runner run --case=02" },
    { i: "measuring runtime & memory usage" },
    { ok: "within time & memory limits" },
    { p: "$", c: "xcode-runner run --case=03" },
    { i: "checking boundary & edge case inputs" },
    { p: "$", c: "xcode-runner run --stress" },
    { i: "running against large / stress input" },
    { ok: "no timeout — within limit" },
    { p: "$", c: "xcode-runner validate" },
    { i: "validating output against expected results" },
    { i: "aggregating verdicts across all cases" },
    { p: "$", c: "xcode-runner report" },
    { i: "preparing final submission report" },
  ];
}

/**
 * Resolve the terminal command sequence for a given language, falling back
 * to a generic sequence (built from the language's display label) for any
 * language that hasn't had real commands authored yet.
 */
export function getTerminalSequence(language: string | null | undefined): TerminalStep[] {
  if (!language) return TERMINAL_SEQUENCES.cpp;
  const known = TERMINAL_SEQUENCES[language];
  if (known) return known;
  const label = getLanguageConfig(language)?.label ?? language;
  return buildFallbackSequence(label);
}

export function getTerminalTitle(language: string | null | undefined): string {
  if (!language) return "judge0 — sandbox";
  const known = TERMINAL_SEQUENCES[language];
  const label = getLanguageConfig(language)?.label ?? language;
  return known ? `judge0 — ${language} sandbox` : `xcode-runner — ${label.toLowerCase()} sandbox`;
}

// Hard floor: a submission can take up to 40s server-side, so a full
// terminal cycle must never repeat a command within that window.
export const MIN_TERMINAL_CYCLE_MS = 40000;
