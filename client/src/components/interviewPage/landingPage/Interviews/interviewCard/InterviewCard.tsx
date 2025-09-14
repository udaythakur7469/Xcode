"use client";

import React, { forwardRef, useEffect, useState } from "react";
import Image from "next/image";
import { Calendar, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import DisplayTechIcons from "./DisplayTechIcons";
import { getRandomInterviewCover, getTechLogos } from "@/services/interviewServices/interviewService";
import moment from "moment";
import { useRouter } from "next/navigation";

enum interviewType {
  BEHAVIORAL = "BEHAVIORAL",
  TECHNICAL = "TECHNICAL",
  MIXED = "MIXED",
}

interface InterviewCardProps {
  id: string | number;
  role: string;
  type: string;
  techStack: string[];
  finalized: boolean;
  feedbackFinalized: boolean;
  createdAt: string;
  updatedAt: string;
  source? : "user" | "all";
}

const InterviewCard = forwardRef<HTMLDivElement, InterviewCardProps>(
  (
    {
      id,
      role,
      type,
      techStack,
      finalized,
      feedbackFinalized,
      createdAt,
      updatedAt,
      source,
    },
    ref
  ) => {
    const [techIcons, setTechIcons] = useState<{ tech: string; url: string }[]>(
      []
    );

    useEffect(() => {
      const fetchTechIcons = async () => {
        const icons = await getTechLogos(techStack);
        setTechIcons(icons);
      };
      fetchTechIcons();
    }, []);

    const formattedInterviewType = type.charAt(0) + type.slice(1).toLowerCase();
    const formattedDate = moment(updatedAt).format("DD MMMM YYYY");

    const router = useRouter();

    const takeToFeedbackPage = (source: "user" | "all") => {
      router.push(`interview/feedback/${id}?source=${source}`);
    };
    const takeToPracticeInterviewPage = () => {
      router.push(`interview/practice-interview/${id}`);
    };

    return (
      <div
        ref={ref}
        className="h-[296px] w-[400px] border rounded-xl blue-gradient-dark"
      >
        <div className="h-[25%] flex flex-row justify-between items-start mb-2">
          <div className="relative h-full w-auto aspect-square ml-4 items-end mt-2">
            <Image
              src={getRandomInterviewCover()}
              alt="adobe"
              fill
              className="object-contain"
            />
          </div>
          <div className="flex rounded-xl p-0.5 bg-[#4e5578] cursor-pointer">
            <div className="flex flex-col justify-start text-lg px-2">
              {formattedInterviewType}
            </div>
          </div>
        </div>
        <div className="flex text-2xl mt-2">
          <p className="flex justify-center items-center mx-5 mt-2">
            {role} interview
          </p>
        </div>
        <div className="my-3 mx-5 flex flex-row justify-start space-x-6">
          <div className="flex flex-row">
            <Calendar className="mr-2" />
            <p>{formattedDate}</p>
          </div>
          <div className="flex flex-row">
            <Star className="mr-2 fill-current" />
            <p>.../100</p>
          </div>
        </div>
        <div className="mt-2 mx-5">
          <p>
            {feedbackFinalized
              ? "You have completed this interview, Check the feedback"
              : "You haven't taken this interview yet. Take it now to improve your skills."}
          </p>
        </div>
        <div className="flex flex-row mt-5 justify-between items-center">
          <div className="ml-3">
            <DisplayTechIcons techIcons={techIcons} />
          </div>
          <div className="mr-5">
            <Button
              variant="secondary"
              className="bg-[#4e5578] rounded-3xl text-xl"
              onClick={() => {
                if (feedbackFinalized) {
                  takeToFeedbackPage(source);
                } else {
                  takeToPracticeInterviewPage();
                }
              }}
            >
              {feedbackFinalized ? "Check Feedback" : "Take Interview"}
            </Button>
          </div>
        </div>
      </div>
    );
  }
);

InterviewCard.displayName = "InterviewCard";

export default InterviewCard;
