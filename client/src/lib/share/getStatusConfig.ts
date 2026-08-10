import { getLanguageConfig } from "./languageConfig";

// ─── Icon key registry ─────────────────────────────────────────────────────
// Kept as a string key rather than JSX so this file stays a plain, testable
// .ts module. The actual lucide-react component is resolved in
// components/problemDetailPage/shared/statusIcons.tsx via STATUS_ICON_MAP.

export type StatusIconKey =
  | "check"
  | "x"
  | "code"
  | "alertTriangle"
  | "terminal"
  | "clock"
  | "hardDrive"
  | "wifiOff";

// IMPORTANT: every color value here is consumed via inline `style={}`
// props in components, NEVER interpolated into a Tailwind className
// string (e.g. `text-[${color}]`). Tailwind's JIT scanner only detects
// complete class-name literals that exist verbatim in source files —
// a runtime-built arbitrary-value class silently produces no CSS at
// all in production, even though it looks correct in dev with the JIT
// watcher running against the same file. Inline styles sidestep that
// class entirely and are safe for fully dynamic, per-status colors.
export type StatusCfg = {
  key: string;
  label: string;
  accentColor: string; // raw hex, use via style={{ color: accentColor }}
  softBg: string; // raw hex+alpha, use via style={{ background: softBg }}
  subtitleText: string;
  icon: StatusIconKey;
};

export const SYNTAX_ERROR_PATTERNS =
  /SyntaxError|IndentationError|ParseError|unexpected token|invalid syntax/i;

// ─── Semantic status colors ─────────────────────────────────────────────────
// Strong, LeetCode-grade saturation — deliberately distinct from the old
// muted teal/red/amber palette. Compilation / Runtime / Syntax errors each
// get their own shade within the orange family so they read as siblings,
// not duplicates of Wrong Answer's red or of each other.

export const STATUS_COLORS = {
  accepted: "#22C55E",
  wrongAnswer: "#EF4444",
  compilationError: "#F97316",
  runtimeError: "#FB923C",
  syntaxError: "#C2611A",
  timeLimitExceeded: "#F59E0B",
  memoryLimitExceeded: "#D97706",
  networkError: "#94A3B8",
} as const;

function cfgFor(
  key: string,
  color: string,
  label: string,
  subtitleText: string,
  icon: StatusIconKey,
): StatusCfg {
  return {
    key,
    label,
    accentColor: color,
    softBg: `${color}1F`, // ~12% alpha
    subtitleText,
    icon,
  };
}

export function getStatusCfg(
  status: string,
  statusDescription?: string | null,
  language?: string,
  stderr?: string | null,
): StatusCfg {
  if (status === "accepted")
    return cfgFor(
      "accepted",
      STATUS_COLORS.accepted,
      "Accepted",
      "The submission completed successfully and passed all test cases.",
      "check",
    );

  if (status === "wrong_answer")
    return cfgFor(
      "wrong_answer",
      STATUS_COLORS.wrongAnswer,
      "Wrong Answer",
      "The submission produced incorrect output for one or more test cases.",
      "x",
    );

  if (status === "compilation_error")
    return cfgFor(
      "compilation_error",
      STATUS_COLORS.compilationError,
      "Compilation Error",
      "The code could not be compiled because of syntax or build issues.",
      "code",
    );

  if (status === "time_limit_exceeded")
    return cfgFor(
      "time_limit_exceeded",
      STATUS_COLORS.timeLimitExceeded,
      "Time Limit Exceeded",
      "The solution was too slow and exceeded the allowed execution time.",
      "clock",
    );

  if (status === "memory_limit_exceeded")
    return cfgFor(
      "memory_limit_exceeded",
      STATUS_COLORS.memoryLimitExceeded,
      "Memory Limit Exceeded",
      "The solution used more memory than the allowed limit.",
      "hardDrive",
    );

  if (status === "internal_error" || status === "unknown_error")
    return cfgFor(
      status,
      STATUS_COLORS.networkError,
      "Server Error",
      "An internal error occurred while processing the submission. Please try again.",
      "wifiOff",
    );

  // For interpreted languages: remap NZEC runtime errors that contain syntax errors
  if (
    status === "runtime_error" &&
    typeof language === "string" &&
    getLanguageConfig(language)?.isInterpreted &&
    stderr &&
    SYNTAX_ERROR_PATTERNS.test(stderr)
  ) {
    return cfgFor(
      "syntax_error",
      STATUS_COLORS.syntaxError,
      "Syntax Error",
      "The code contained a syntax issue that prevented execution.",
      "terminal",
    );
  }

  return cfgFor(
    "runtime_error",
    STATUS_COLORS.runtimeError,
    "Runtime Error",
    "The program crashed or failed during execution.",
    "alertTriangle",
  );
}

export function getConnectionErrorCfg(message: string): StatusCfg {
  return cfgFor(
    "connection_error",
    STATUS_COLORS.networkError,
    "Connection Error",
    message,
    "wifiOff",
  );
}
