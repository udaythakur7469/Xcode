"use client";

import React from "react";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { cpp } from "@codemirror/lang-cpp";
import { java } from "@codemirror/lang-java";
import { githubDark, githubLight, dracula } from "@uiw/codemirror-themes-all";

const LANG_EXTENSIONS: Record<string, () => unknown> = { python, cpp, java, javascript };
const THEME_MAP: Record<string, unknown> = {
  dark: githubDark, light: githubLight, dracula,
  "github-light": githubLight, "github-dark": githubDark,
};

type CodeEditorSurfaceProps = {
  code: string;
  onCodeChange: (value: string) => void;
  language: string;
  theme: string;
  fontSize: number;
};

export default function CodeEditorSurface({ code, onCodeChange, language, theme, fontSize }: CodeEditorSurfaceProps) {
  return (
    <CodeMirror
      value={code}
      height="100%"
      theme={THEME_MAP[theme] ?? githubDark}
      extensions={[LANG_EXTENSIONS[language]?.() ?? python()]}
      onChange={onCodeChange}
      style={{ fontSize: `${fontSize}px`, flex: 1 }}
      className="flex-1"
    />
  );
}
