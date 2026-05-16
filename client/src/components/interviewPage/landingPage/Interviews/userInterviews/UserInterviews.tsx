"use client";

import React, { useEffect, useRef, useState } from "react";
import InterviewCard from "../interviewCard/InterviewCard";
import { Button } from "@/components/ui/button";
import InterviewDialog from "../helperComponents/InterviewDialog";
import { useInterviewStore } from "@/features/interviewStore";
import { InterviewRowSkeleton } from "../interviewCard/InterviewCardSkeleton";

type UserInterviewsProps = {};

const UserInterviews: React.FC<UserInterviewsProps> = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const measureCardRef = useRef<HTMLDivElement>(null);
  const {
    getInterviewsByUserId,
    userInterviews,
    isLoadingUserInterviews,
    interviewError,
  } = useInterviewStore();

  // State for UI calculations
  const [visibleCards, setVisibleCards] = useState(0);
  const [cardWidth, setCardWidth] = useState(0);
  const [isUserInterviewDialogOpen, setIsUserInterviewDialogOpen] =
    useState(false);

  // Constants
  const gap = 16; // space-x-4 = 16px
  const leftMargin = 20; // ml-5 = 20px

  // Call the API on component mount
  useEffect(() => {
    getInterviewsByUserId();
  }, [getInterviewsByUserId]);

  // Only set up measurements AFTER data loads
  useEffect(() => {
    if (isLoadingUserInterviews || userInterviews.length === 0) return;

    // Measure card width once data is available
    if (measureCardRef.current?.clientWidth) {
      setCardWidth(measureCardRef.current.clientWidth);
    }

    const updateVisibleCards = () => {
      if (!containerRef.current) return;
      const containerWidth = containerRef.current.clientWidth;
      const availableWidth = containerWidth - leftMargin;
      const maxCards = Math.floor((availableWidth + gap) / (cardWidth + gap));
      setVisibleCards(Math.max(0, Math.min(maxCards, userInterviews.length)));
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
  }, [cardWidth, userInterviews.length, isLoadingUserInterviews]);

  if (isLoadingUserInterviews) {
    return <InterviewRowSkeleton title="Your Interviews" cardCount={3} />;
  }

  if (interviewError) {
    return (
      <div className="py-2 ml-5 mt-5 text-red-500 text-center">
        {interviewError}
      </div>
    );
  }

  if (userInterviews.length === 0) {
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
          <div className="text-3xl font-bold py-2 ml-5 mb-3">
            Your Interviews
          </div>
          <div className="ml-5 mb-3 flex justify-center items-end">
            <Button
              variant="secondary"
              onClick={() => setIsUserInterviewDialogOpen(true)}
            >
              Show all
            </Button>
          </div>
        </div>

        {/* Hidden card for measurement */}
        <div className="absolute opacity-0 pointer-events-none">
          <InterviewCard
            ref={measureCardRef}
            {...userInterviews[0]}
            source="user"
          />
        </div>

        {/* Main container */}
        <div
          ref={containerRef}
          className="w-full max-w-[100vw] h-[300px] relative overflow-hidden"
        >
          <div className="flex space-x-16 py-0.5 ml-5 h-full">
            {userInterviews.slice(0, visibleCards).map((interview) => (
              <InterviewCard key={interview.id} {...interview} source="user" />
            ))}
          </div>
        </div>
      </div>
      <InterviewDialog
        isOpen={isUserInterviewDialogOpen}
        onClose={() => setIsUserInterviewDialogOpen(false)}
        title="Your Interviews"
        interviews={userInterviews}
        source="user"
      />
    </>
  );
};

export default UserInterviews;
