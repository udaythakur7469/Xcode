"use client";

import React, { useRef } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { cpp } from "@codemirror/lang-cpp";
import { java } from "@codemirror/lang-java";
import { githubDark } from "@uiw/codemirror-themes-all";

// ─── ContestCodeEditor ───────────────────────────────────────────────────
// Deliberately its own small component rather than reusing
// problemDetailPage/codePanel/editor/CodeEditor.tsx — that one is tightly
// coupled to useProblemStore, the revision queue, and URL search params,
// none of which apply inside a contest workspace. This keeps the same
// CodeMirror + language-extension setup, without dragging in unrelated
// state.

type ContestCodeEditorProps = {
  code: string;
  onChange: (value: string) => void;
  language: string;
};

function getLanguageExtension(language: string) {
  switch (language) {
    case "javascript":
      return javascript();
    case "python":
      return python();
    case "java":
      return java();
    default:
      return cpp();
  }
}

export default function ContestCodeEditor({ code, onChange, language }: ContestCodeEditorProps) {
  const lastValueRef = useRef(code);

  return (
    <CodeMirror
      value={code}
      height="100%"
      width="100%"
      extensions={[getLanguageExtension(language)]}
      theme={githubDark}
      onChange={(value) => {
        lastValueRef.current = value;
        onChange(value);
      }}
      style={{ fontSize: "14px", height: "100%" }}
    />
  );
}
