import React from "react";
import InterviewPractice from "@/components/interviewPage/interviewPracticePage/InterviewPractice";

type pageProps = { params: { id: number | null } };

const page: React.FC<pageProps> = ({ params }) => {
  const unwrappedParams = React.use(params);
  const { id } = unwrappedParams;
  if (!id) {
    return <div className="text-red-500 text-xl">interview not found</div>;
  }
  return (
    <>
      <InterviewPractice type="practice" id={id} />
    </>
  );
};
export default page;
