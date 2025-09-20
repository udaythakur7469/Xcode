import React, { useEffect, useRef, useState } from "react";
import { Maximize, Minimize } from "lucide-react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import CommentMarkdownEditor from "../commentMarkdownEditor/CommentMarkdownEditor";
import CommentMarkdownPreview from "../commentMarkdownPreview/CommentMarkdownPreview";

type CommentResizablePanelsProps = {
  content: string;
  setContent: (value: string) => void;
  onSelectionChange?: (start: number, end: number) => void;
};

const CommentResizablePanels: React.FC<CommentResizablePanelsProps> = ({
  content,
  setContent,
  onSelectionChange,
}) => {
  const [horizontalSizes, setHorizontalSizes] = useState([50, 50]);
  const [isLeftMaximized, setIsLeftMaximized] = useState(false);
  const [isRightMaximized, setIsRightMaximized] = useState(false);
  const [shouldMaximizeHorizontal, setShouldMaximizeHorizontal] =
    useState(false);

  // Refs for imperative control
  const leftPanelRef = useRef<any>(null);
  const rightPanelRef = useRef<any>(null);

  // Left panel maximize function
  const handleLeftMaximize = () => {
    if (isLeftMaximized) {
      // Minimize: restore to normal sizes
      setHorizontalSizes([50, 50]);
      setIsRightMaximized(false);
    } else {
      // Maximize: left panel takes full width, right panel becomes zero
      setHorizontalSizes([100, 0]);
      setIsRightMaximized(false);
    }
    setIsLeftMaximized(!isLeftMaximized);
    setShouldMaximizeHorizontal(true);
  };

  // Right panel maximize function
  const handleRightMaximize = () => {
    if (isRightMaximized) {
      // Minimize: restore to normal sizes
      setHorizontalSizes([50, 50]);
      setIsLeftMaximized(false);
    } else {
      // Maximize: right panel takes full width, left panel becomes zero
      setHorizontalSizes([0, 100]);
      setIsLeftMaximized(false);
    }
    setIsRightMaximized(!isRightMaximized);
    setShouldMaximizeHorizontal(true);
  };

  useEffect(() => {
    if (shouldMaximizeHorizontal) {
      // Use the imperative API to resize horizontal panels
      if (leftPanelRef.current && rightPanelRef.current) {
        leftPanelRef.current.resize(horizontalSizes[0]);
        rightPanelRef.current.resize(horizontalSizes[1]);
      }
      setShouldMaximizeHorizontal(false);
    }
  }, [shouldMaximizeHorizontal, horizontalSizes]);

  const handleHorizontalLayoutChange = (sizes: number[]) => {
    setHorizontalSizes(sizes);

    // Update maximize states based on actual sizes
    if (sizes[0] > 95) {
      setIsLeftMaximized(true);
      setIsRightMaximized(false);
    } else if (sizes[1] > 95) {
      setIsRightMaximized(true);
      setIsLeftMaximized(false);
    } else if (Math.abs(sizes[0] - 50) < 10 && Math.abs(sizes[1] - 50) < 10) {
      setIsLeftMaximized(false);
      setIsRightMaximized(false);
    }
  };

  return (
    <div className="h-full w-full flex justify-center items-center">
      <ResizablePanelGroup
        direction="horizontal"
        onLayout={handleHorizontalLayoutChange}
      >
        {/* Left Panel (Input) */}
        <ResizablePanel
          ref={leftPanelRef}
          defaultSize={50}
          minSize={0}
          maxSize={100}
          className="border mr-1 relative rounded-bl-xl"
        >
          {/* Maximize/Minimize button for left panel - only show when panel is visible */}
          {horizontalSizes[0] > 0 && (
            <HoverCard>
              <HoverCardTrigger asChild>
                <button
                  onClick={handleLeftMaximize}
                  className="absolute top-2 right-2 z-10 p-1 rounded transition-colors"
                >
                  {isLeftMaximized ? (
                    <Minimize className="h-4 w-4 text-yellow-500" />
                  ) : (
                    <Maximize className="h-4 w-4 text-yellow-500" />
                  )}
                </button>
              </HoverCardTrigger>
              <HoverCardContent className="mr-5 p-1">
                {isLeftMaximized ? "Minimize" : "Maximize"}
              </HoverCardContent>
            </HoverCard>
          )}
          <div className="h-full w-full flex items-center justify-center">
            <CommentMarkdownEditor
              content={content}
              setContent={setContent}
              onSelectionChange={onSelectionChange}
            />
          </div>
        </ResizablePanel>

        {/* Resizable Handle - only show when both panels are visible */}
        {horizontalSizes[0] > 0 && horizontalSizes[1] > 0 && (
          <div className="flex justify-center items-center w-1 hover:bg-green-600 rounded-md my-1">
            <ResizableHandle withHandle />
          </div>
        )}

        {/* Right Panel (Output) */}
        <ResizablePanel
          ref={rightPanelRef}
          defaultSize={50}
          minSize={0}
          maxSize={100}
          className="border ml-1 relative rounded-br-xl"
        >
          {/* Maximize/Minimize button for right panel - only show when panel is visible */}
          {horizontalSizes[1] > 0 && (
            <HoverCard>
              <HoverCardTrigger asChild>
                <button
                  onClick={handleRightMaximize}
                  className="absolute top-2 right-2 z-10 p-1 rounded transition-colors"
                >
                  {isRightMaximized ? (
                    <Minimize className="h-4 w-4 text-yellow-500" />
                  ) : (
                    <Maximize className="h-4 w-4 text-yellow-500" />
                  )}
                </button>
              </HoverCardTrigger>
              <HoverCardContent className="mr-5 p-1">
                {isRightMaximized ? "Minimize" : "Maximize"}
              </HoverCardContent>
            </HoverCard>
          )}
          <div className="h-full w-full flex items-center justify-center">
            <CommentMarkdownPreview markdown={content} />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default CommentResizablePanels;
