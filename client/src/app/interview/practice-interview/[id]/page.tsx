import React from "react";
import InterviewPractice from "@/components/interviewPage/interviewPracticePage/InterviewPractice";

type pageProps = { params: Promise<{ id: string }> };

const Page = ({ params }: pageProps) => {
  const unwrappedParams = React.use(params);
  const { id } = unwrappedParams;
  if (!id) {
    return <div className="text-red-500 text-xl">interview not found</div>;
  }
  return (
    <>
      <InterviewPractice type="practice" id={Number(id)} />
    </>
  );
};
export default Page;
