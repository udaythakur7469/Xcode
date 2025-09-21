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
import { ScrollArea } from "@/components/ui/commentTagsScrollArea";
import { forwardRef, useImperativeHandle } from "react";

type CommentResizablePanelsProps = {
  content: string;
  setContent: (value: string) => void;
  onSelectionChange?: (start: number, end: number) => void;
};

export interface CommentResizablePanelsRef {
  resetLayout: () => void;
}

const CommentResizablePanels = forwardRef<
  CommentResizablePanelsRef,
  CommentResizablePanelsProps
>(({ content, setContent, onSelectionChange }, ref) => {
  const [horizontalSizes, setHorizontalSizes] = useState([50, 50]);
  const [isLeftMaximized, setIsLeftMaximized] = useState(false);
  const [isRightMaximized, setIsRightMaximized] = useState(false);
  const [shouldMaximizeHorizontal, setShouldMaximizeHorizontal] =
    useState(false);

  // Refs for imperative control
  const leftPanelRef = useRef<any>(null);
  const rightPanelRef = useRef<any>(null);

  // Expose reset function to parent via ref
  useImperativeHandle(ref, () => ({
    resetLayout: () => {
      setHorizontalSizes([50, 50]);
      setIsLeftMaximized(false);
      setIsRightMaximized(false);
      setShouldMaximizeHorizontal(true);
    },
  }));

  // Left panel maximize function
  const handleLeftMaximize = () => {
    if (isLeftMaximized) {
      // Minimize: restore to normal sizes
      setHorizontalSizes([50, 50]);
      setIsRightMaximized(false);
    } else {
      // Maximize: left panel takes full width, right panel becomes zero
      setHorizontalSizes([95, 5]);
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
      setHorizontalSizes([5, 95]);
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
          minSize={5}
          maxSize={100}
          className="border mr-1 relative rounded-bl-xl"
        >
          {/* Maximize/Minimize button for left panel - only show when panel is visible */}
          {horizontalSizes[0] > 0 && (
            <HoverCard>
              <HoverCardTrigger asChild>
                <button
                  onClick={handleLeftMaximize}
                  className="absolute top-1 right-2 z-10 p-1 rounded transition-colors"
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
          <ScrollArea className="h-[458px] w-full">
            <div className="h-[458px] w-full">
              <CommentMarkdownEditor
                content={content}
                setContent={setContent}
                onSelectionChange={onSelectionChange}
              />
            </div>
          </ScrollArea>
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
          minSize={5}
          maxSize={100}
          className="border ml-1 relative rounded-br-xl"
        >
          {/* Maximize/Minimize button for right panel - only show when panel is visible */}
          {horizontalSizes[1] > 0 && (
            <HoverCard>
              <HoverCardTrigger asChild>
                <button
                  onClick={handleRightMaximize}
                  className="absolute top-1 right-2 z-10 p-1 rounded transition-colors"
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
          <ScrollArea className="h-[457px] w-full">
            <div className="h-[457px] w-full">
              <CommentMarkdownPreview markdown={content} />
            </div>
          </ScrollArea>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
});

CommentResizablePanels.displayName = "CommentResizablePanels";

export default CommentResizablePanels;
