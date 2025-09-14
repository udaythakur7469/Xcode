"use client";

import React from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import InterviewCard from "../interviewCard/InterviewCard";
import { ShowInterviewData } from "@/features/interviewStore";

type InterviewDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  interviews?: ShowInterviewData[];
  source?: "user" | "all";
};

const InterviewDialog: React.FC<InterviewDialogProps> = ({
  isOpen,
  onClose,
  title,
  interviews = [],
  source,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="backdrop-blur-2xl h-[calc(100vh-50px)] w-[calc(100vw-80px)] max-w-none">
        <DialogTitle className="flex justify-center text-3xl mb-4">
          {title}
        </DialogTitle>
        <div className="flex flex-wrap gap-16 overflow-y-auto h-[calc(100%-20px)] scrollbar-white">
          {interviews.length > 0 ? (
            interviews.map((interview) => (
              <InterviewCard
                key={interview.id}
                {...interview}
                source={source}
              />
            ))
          ) : (
            <div className="w-full text-center py-10">
              No interviews available
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InterviewDialog;
