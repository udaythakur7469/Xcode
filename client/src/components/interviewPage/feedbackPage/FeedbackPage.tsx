import React from "react";
import Image from "next/image";
import { Feedback, Interview } from "@/features/interviewStore";
import moment from "moment";
import { Dot, House, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";

type FeedbackPageProps = {
  feedback: Feedback;
  interview: Interview;
};

const FeedbackPage: React.FC<FeedbackPageProps> = ({ feedback, interview }) => {
  console.log("feedback", feedback);
  console.log("interview", interview);

  const router = useRouter();

  const formattedDate = moment(feedback?.updatedAt).format(
    "MMM D, YYYY h:mm A"
  );

  const formattedVerdict = feedback?.finalVerdict
    ? feedback.finalVerdict
        .toLowerCase()
        .split("_")
        .map((word) => word[0].toUpperCase() + word.slice(1))
        .join(" ")
    : "";

  const verdictColor = !formattedVerdict
    ? "bg-gray-100 text-gray-800"
    : formattedVerdict === "Must Hire"
    ? "bg-green-100 text-green-800"
    : formattedVerdict === "Recommended"
    ? "bg-emerald-100 text-emerald-800"
    : formattedVerdict === "Worth Considering"
    ? "bg-yellow-100 text-yellow-800"
    : formattedVerdict === "Not Recommended"
    ? "bg-red-100 text-red-800"
    : formattedVerdict === "Do Not Hire"
    ? "bg-red-200 text-red-900"
    : formattedVerdict === "Prefer Not To Hire"
    ? "bg-amber-100 text-amber-800"
    : "bg-gray-100 text-gray-800";

  const goToHomePage = () => {
    router.push("/interview");
  };

  const numericId = Number(interview?.id);
  
  const goToInterviewPage = () => {
    router.push(`/interview/practice-interview/${numericId}`);
  };

  return (
    <>
      <div className="flex flex-row justify-center items-center">
        <div className="text-7xl flex flex-col justify-center items-center">
          <div className="mb-4">
            Feedback of the Interview- <br />
          </div>
          <div className="mb-4">{interview?.role}</div>
        </div>
      </div>
      <div className="flex flex-row justify-center gap-x-10 mt-5">
        <div className="flex flex-row items-center justify-evenly">
          <Image
            src="/star.svg"
            width={22}
            height={22}
            alt="star"
            className="mr-2"
          />
          <div className="text-lg">
            Overall Impression: {feedback?.totalScore}/100
          </div>
        </div>
        <div className="flex flex-row items-center justify-evenly">
          <Image
            src="/calender.svg"
            width={22}
            height={22}
            alt="star"
            className="mr-2"
          />
          <div className="text-lg">{formattedDate}</div>
        </div>
      </div>
      <hr className="mt-5 mx-8" />
      <div className="flex flex-col justify-center">
        <div className="flex flex-col justify-center items-center mx-16 mt-5 text-lg">
          {feedback?.finalAssessment}
        </div>
        <div className="mx-16 mt-8 text-6xl font-bold">
          Breakdown of Evaluation :{" "}
        </div>
        <div className="mt-5 mx-16">
          {feedback?.categoryScores?.map((category, index) => (
            <div key={index}>
              <div className="text-2xl">
                {index + 1} {category.name} ({category.score}/100)
              </div>
              <div className="flex flex-col mt-4 mx-2 mb-4 text-lg">
                {" "}
                {category.comment?.split(".").map(
                  (sentence, i) =>
                    sentence.trim() && (
                      <div key={i} className="mb-2 flex flex-row">
                        <Dot />
                        {sentence.trim()}.
                      </div>
                    )
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-row items-center mx-16 mt-3 mb-5 text-4xl">
          Strengths:
        </div>
        <div className="mx-16 mb-4 text-lg">
          {Array.isArray(feedback?.strengths)
            ? feedback?.strengths?.map((strength, index) => (
                <div key={index} className="mb-2 flex flex-row ml-2">
                  <Dot />
                  <span className="ml-2">{strength}</span>
                </div>
              ))
            : feedback?.strengths}
        </div>

        <div className="flex flex-row items-center mx-16 text-6xl mt-4 mb-6">
          Final Verdict :
          <div className="flex flex-row items-center ml-4">
            <span
              className={`flex justify-center items-center rounded-full border font-bold py-4 px-6 ${verdictColor}`}
            >
              {formattedVerdict}
            </span>
          </div>
        </div>
        <div className="flex flex-row items-center mx-16 mt-3 mb-5 text-4xl">
          Areas of Improvement:
        </div>
        <div className="mx-16 mb-5 text-lg">
          {Array.isArray(feedback?.areasForImprovement)
            ? feedback?.areasForImprovement?.map(
                (areasForImprovement, index) => (
                  <div key={index} className="mb-2 flex flex-row ml-2">
                    <Dot />
                    <span className="ml-2">{areasForImprovement}</span>
                  </div>
                )
              )
            : feedback?.strengths}
        </div>
        <div className="flex flex-row justify-evenly mx-16 mb-16 text-lg mt-5">
          <button
            className="bg-blue-600 rounded-full cursor-pointer text-4xl px-12 py-2 border hover:bg-blue-800 hover:text-accent-foreground flex flex-row items-center justify-center"
            onClick={() => goToHomePage()}
          >
            <House size={30} className="mr-4 cursor-pointer" />
            <p className="cursor-pointer">Go to Home page</p>
          </button>
          <button
            className="bg-green-600 rounded-full cursor-pointer text-4xl px-12 py-2 border hover:bg-green-800 hover:text-accent-foreground flex flex-row items-center justify-center"
            onClick={() => goToInterviewPage()}
          >
            <RotateCcw size={30} className="mr-4 cursor-pointer" />
            <p className="cursor-pointer">Retake Interview</p>
          </button>
        </div>
      </div>
    </>
  );
};
export default FeedbackPage;
