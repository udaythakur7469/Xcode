import React from "react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  ArrowLeft,
  Expand,
  Maximize,
  Minimize,
  Shrink,
  Sparkles,
} from "lucide-react";
import { useAiAnalysisPanel } from "@/context/aiAnalysisPanelContext";

type AIAnalysisPanelProps = {
  isMaximized: boolean;
  handleMaximizeMinimize: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
};

const AIAnalysisPanel: React.FC<AIAnalysisPanelProps> = ({
  isMaximized,
  handleMaximizeMinimize,
  isFullscreen,
  onToggleFullscreen,
}) => {
  const { setIsOpen } = useAiAnalysisPanel();

  return (
    <div className="h-full w-full bg-background flex flex-col">
      {/* Toolbar */}
      <div className="h-[40px] bg-secondary rounded-t-md flex flex-row justify-end px-1 items-center shrink-0">
        <div className="flex justify-end mr-2 items-center">
          {/* Toggle between Fullscreen (Expand) and Exit Fullscreen (Shrink)
              icons — spans BOTH the left and right resizable panels, unlike
              Maximize/Minimize below which only resizes the right panel. */}
          {isFullscreen ? (
            <HoverCard>
              <HoverCardTrigger asChild>
                <Shrink
                  className="ml-2 mr-2 cursor-pointer text-blue-500 hover:text-blue-600"
                  size={20}
                  onClick={onToggleFullscreen}
                />
              </HoverCardTrigger>
              <HoverCardContent className="mr-5 p-1">
                Exit Fullscreen
              </HoverCardContent>
            </HoverCard>
          ) : (
            <HoverCard>
              <HoverCardTrigger asChild>
                <Expand
                  className="ml-2 mr-2 cursor-pointer text-blue-500 hover:text-blue-600"
                  size={20}
                  onClick={onToggleFullscreen}
                />
              </HoverCardTrigger>
              <HoverCardContent className="mr-5 p-1">
                Fullscreen
              </HoverCardContent>
            </HoverCard>
          )}

          {/* Toggle between Maximize and Minimize icons */}
          {isMaximized ? (
            <HoverCard>
              <HoverCardTrigger asChild>
                <Minimize
                  className="ml-2 mr-2 cursor-pointer text-yellow-500 hover:text-yellow-600"
                  size={20}
                  onClick={handleMaximizeMinimize}
                />
              </HoverCardTrigger>
              <HoverCardContent className="mr-5 p-1">Minimize</HoverCardContent>
            </HoverCard>
          ) : (
            <HoverCard>
              <HoverCardTrigger asChild>
                <Maximize
                  className="ml-2 mr-2 cursor-pointer text-yellow-500 hover:text-yellow-600"
                  size={20}
                  onClick={handleMaximizeMinimize}
                />
              </HoverCardTrigger>
              <HoverCardContent className="mr-5 p-1">Maximize</HoverCardContent>
            </HoverCard>
          )}
        </div>
      </div>

      {/* Header — fixed, never scrolls */}
      <div className="flex items-center justify-start pb-1 mt-2 border-b shrink-0">
        <button
          onClick={() => setIsOpen(false)}
          className="flex flex-row items-center justify-center"
          aria-label="Close"
        >
          <ArrowLeft size={18} className="mx-1" />
          Back to editor
        </button>
      </div>

      {/* Blank content area — placeholder for the future AI analysis feature */}
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-3 text-muted-foreground select-none">
        <Sparkles size={28} strokeWidth={1.4} className="opacity-30" />
        <p className="text-sm font-medium">AI Analysis</p>
        <p className="text-xs opacity-60 text-center max-w-[220px]">
          This panel is a placeholder — analysis content coming soon.
        </p>
      </div>
    </div>
  );
};

export default AIAnalysisPanel;
