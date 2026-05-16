"use client";

import React, { useEffect, useRef, useState } from "react";
import InterviewCard from "../interviewCard/InterviewCard";
import { Button } from "@/components/ui/button";
import InterviewDialog from "../helperComponents/InterviewDialog";
import { useInterviewStore } from "@/features/interviewStore"; // Import your store
import { InterviewRowSkeleton } from "../interviewCard/InterviewCardSkeleton";

type AllInterviewsProps = {};

const AllInterviews: React.FC<AllInterviewsProps> = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const measureCardRef = useRef<HTMLDivElement>(null);

  // Get data from your store
  const {
    getLatestInterviews,
    latestInterviews,
    isLoadingLatestInterviews,
    interviewError,
  } = useInterviewStore();

  const [visibleCards, setVisibleCards] = useState(0);
  const [cardWidth, setCardWidth] = useState(0);
  const gap = 16; // space-x-4 = 16px
  const leftMargin = 20; // ml-5 = 20px
  const [isAllInterviewDialogOpen, setIsAllInterviewDialogOpen] =
    useState(false);

  // Fetch data on mount
  useEffect(() => {
    getLatestInterviews();
  }, [getLatestInterviews]);

  // Only set up measurements AFTER data loads
  useEffect(() => {
    if (isLoadingLatestInterviews || latestInterviews.length === 0) return;

    // Measure card width
    if (measureCardRef.current?.clientWidth) {
      setCardWidth(measureCardRef.current.clientWidth);
    }

    const updateVisibleCards = () => {
      if (!containerRef.current) return;
      const containerWidth = containerRef.current.clientWidth;
      const availableWidth = containerWidth - leftMargin;
      const maxCards = Math.floor((availableWidth + gap) / (cardWidth + gap));
      setVisibleCards(Math.max(0, Math.min(maxCards, latestInterviews.length)));
    };

    // Debounce function
    const debounce = (fn: Function, delay: number) => {
      let timeoutId: NodeJS.Timeout;
      return (...args: any[]) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delay);
      };
    };

    const debouncedUpdate = debounce(updateVisibleCards, 100);
    const resizeObserver = new ResizeObserver(debouncedUpdate);

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
      updateVisibleCards(); // Initial calculation
    }

    return () => resizeObserver.disconnect();
  }, [cardWidth, latestInterviews.length, isLoadingLatestInterviews]);

  if (isLoadingLatestInterviews) {
    return <InterviewRowSkeleton title="All Interviews" cardCount={3} />;
  }

  if (interviewError) {
    return (
      <div className="py-2 ml-5 mt-5 text-red-500 text-center">
        {interviewError}
      </div>
    );
  }

  if (latestInterviews.length === 0) {
    return (
      <p className="py-2 ml-5 mt-5 text-center">
        There are no interviews available
      </p>
    );
  }

  return (
    <>
      <div className="w-full">
        <div className="flex flex-row mr-5 justify-between">
          <div className="text-3xl font-bold py-1 ml-5 mb-3">
            All Interviews
          </div>
          <div className="py-1 ml-5 mb-3 flex justify-center items-center">
            <Button
              variant="secondary"
              onClick={() => setIsAllInterviewDialogOpen(true)}
            >
              Show all
            </Button>
          </div>
        </div>

        {/* Hidden card for measurement */}
        <div className="absolute opacity-0 pointer-events-none">
          <InterviewCard
            ref={measureCardRef}
            {...latestInterviews[0]} // Use first interview for measurement
            source="all"
          />
        </div>

        {/* Main container */}
        <div
          ref={containerRef}
          className="w-full max-w-[100vw] h-[300px] relative overflow-hidden mb-1"
        >
          <div className="flex space-x-16 py-0.5 ml-5 h-full">
            {latestInterviews.slice(0, visibleCards).map((interview) => (
              <InterviewCard
                key={interview.id}
                {...interview} // Pass all interview data
                source="all"
              />
            ))}
          </div>
        </div>
      </div>
      <InterviewDialog
        isOpen={isAllInterviewDialogOpen}
        onClose={() => setIsAllInterviewDialogOpen(false)}
        title="All Interviews"
        interviews={latestInterviews}
        source="all"
      />
    </>
  );
};

export default AllInterviews;
