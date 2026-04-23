"use client";

import React from "react";
import { ChevronDown } from "lucide-react";
import { useChatStore, AiModel } from "@/features/chatStore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const MODEL_LABELS: Record<AiModel, string> = {
  chatgpt: "ChatGPT",
  claude: "Claude",
  gemini: "Gemini",
};

const MODEL_OPTIONS: AiModel[] = ["chatgpt", "claude", "gemini"];

const ChatTitle: React.FC = () => {
  const aiModel = useChatStore((s) => s.aiModel);
  const setAiModel = useChatStore((s) => s.setAiModel);

  return (
    <div className="flex items-center gap-3 ml-2">
      <span className="text-2xl font-semibold leading-none">Nova AI</span>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="
              flex items-center gap-1.5
              px-2.5 py-1
              text-xs font-medium
              rounded-md
              border border-zinc-600
              bg-zinc-800 hover:bg-zinc-700
              text-zinc-200
              transition-colors
              select-none
            "
          >
            {MODEL_LABELS[aiModel]}
            <ChevronDown size={12} className="opacity-60" />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="start"
          className="min-w-[120px] bg-zinc-900 border-zinc-700 text-zinc-200"
        >
          {MODEL_OPTIONS.map((model) => (
            <DropdownMenuItem
              key={model}
              onClick={() => setAiModel(model)}
              className={`
                text-xs cursor-pointer
                hover:bg-zinc-700 focus:bg-zinc-700
                ${aiModel === model ? "text-blue-400 font-semibold" : ""}
              `}
            >
              {MODEL_LABELS[model]}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default ChatTitle;
