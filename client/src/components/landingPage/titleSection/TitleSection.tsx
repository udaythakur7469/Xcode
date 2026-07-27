"use client";

import React from "react";
import { Button } from "../../ui/button";
import { Code, TvMinimal, ArrowDown } from "lucide-react";
import { useRouter } from "next/navigation";

type TitleSectionProps = {};

const TitleSection: React.FC<TitleSectionProps> = () => {
  const router = useRouter();

  const goToInterviewPage = () => {
    router.push("/interview");
  };

  const goToProblemsPage = () => {
    router.push("/problems");
  };
  const takeToHeroSection = () => {
    const element = document.getElementById("hero");
    element?.scrollIntoView({ behavior: "smooth", block: "end" });
  };
  return (
    <>
      <div className="p-2" />
      <div className="p-10 flex flex-col items-center justify-center cursor-default">
        <div className="text-xl">
          <p className="font-poppins">introducing Nexcode</p>
        </div>
        <div className="p-3" />
        <div className="m-8 mb-2 flex items-center justify-center">
          <p className="font-poppins text-5xl font-bold">
            Master Coding Interviews, One Problem at a Time
          </p>
        </div>
        <div className="p-1" />
        <div className="m-8 mt-16 flex flex-col items-center justify-center">
          <p className="font-poppins text-sm">
            Practice real-world coding problems, sharpen your problem-solving
            skills,
          </p>
          <p className="font-poppins text-sm mt-2">
            get ready to ace your next technical interview with confidence
          </p>
        </div>
        <div className="p-4" />

        <div className="flex justify-center items-center gap-10">
          <Button
            variant="outline"
            className="p-7 text-lg w-[220px] border-2 border-white shadow"
            onClick={goToProblemsPage}
          >
            <Code /> Solve Problems
          </Button>

          <Button
            variant="outline"
            className="p-7 text-lg w-[220px] border-2 border-white shadow"
            onClick={goToInterviewPage}
          >
            <TvMinimal /> Practice Interviews
          </Button>
        </div>

        <div className="p-10">
          <Button
            variant="outline"
            className="m-5 p-7 text-lg border-2 border-white shadow"
            onClick={takeToHeroSection}
          >
            <ArrowDown /> View site features
          </Button>
        </div>
      </div>
    </>
  );
};
export default TitleSection;
