import { getLanguageConfig } from "./languageConfig";

export type StatusCfg = {
  label: string;
  accentColor: string;
  textClass: string;
  dotClass: string;
  passSegClass: string;
  failSegClass: string;
  countClass: string;
  subtitleText: string;
};
export const SYNTAX_ERROR_PATTERNS =
  /SyntaxError|IndentationError|ParseError|unexpected token|invalid syntax/i;

export function getStatusCfg(
  status: string,
  statusDescription?: string | null,
  language?: string,
  stderr?: string | null,
): StatusCfg {
  if (status === "accepted")
    return {
      label: "Accepted",
      accentColor: "#1D9E75",
      textClass: "text-[#1D9E75]",
      dotClass: "bg-[#1D9E75]",
      passSegClass: "bg-[#1D9E75]",
      failSegClass: "bg-[#E24B4A]",
      countClass: "text-[#1D9E75]",
      subtitleText:
        "The submission completed successfully and passed all test cases.",
    };
  if (status === "time_limit_exceeded")
    return {
      label: "Time Limit Exceeded",
      accentColor: "#BA7517",
      textClass: "text-[#BA7517]",
      dotClass: "bg-[#BA7517]",
      passSegClass: "bg-[#1D9E75]",
      failSegClass: "bg-[#BA7517]",
      countClass: "text-[#BA7517]",
      subtitleText:
        "The solution was too slow and exceeded the allowed execution time.",
    };
  if (status === "wrong_answer")
    return {
      label: "Wrong Answer",
      accentColor: "#E24B4A",
      textClass: "text-[#E24B4A]",
      dotClass: "bg-[#E24B4A]",
      passSegClass: "bg-[#1D9E75]",
      failSegClass: "bg-[#E24B4A]",
      countClass: "text-[#E24B4A]",
      subtitleText:
        "The submission produced incorrect output for one or more test cases.",
    };
  if (status === "compilation_error")
    return {
      label: "Compilation Error",
      accentColor: "#E24B4A",
      textClass: "text-[#E24B4A]",
      dotClass: "bg-[#E24B4A]",
      passSegClass: "bg-[#1D9E75]",
      failSegClass: "bg-[#E24B4A]",
      countClass: "text-[#E24B4A]",
      subtitleText:
        "The code could not be compiled because of syntax or build issues.",
    };

  // For interpreted languages: remap NZEC runtime errors that contain syntax errors
  if (
    status === "runtime_error" &&
    typeof language === "string" &&
    getLanguageConfig(language)?.isInterpreted &&
    stderr &&
    SYNTAX_ERROR_PATTERNS.test(stderr)
  ) {
    return {
      label: "Syntax Error",
      accentColor: "#E24B4A",
      textClass: "text-[#E24B4A]",
      dotClass: "bg-[#E24B4A]",
      passSegClass: "bg-[#1D9E75]",
      failSegClass: "bg-[#E24B4A]",
      countClass: "text-[#E24B4A]",
      subtitleText:
        "The code contained a syntax issue that prevented execution.",
    };
  }

  return {
    label: "Runtime Error",
    accentColor: "#E24B4A",
    textClass: "text-[#E24B4A]",
    dotClass: "bg-[#E24B4A]",
    passSegClass: "bg-[#1D9E75]",
    failSegClass: "bg-[#E24B4A]",
    countClass: "text-[#E24B4A]",
    subtitleText: "The program crashed or failed during execution.",
  };
}
