import React from "react";
import InterviewPractice from "@/components/interviewPage/interviewPracticePage/InterviewPractice";
import { Metadata } from "next";

type pageProps = { params: { id: number | null } };

export async function generateMetadata({
  params,
}: pageProps): Promise<Metadata> {
  const unwrappedParams = await params;
  const { id } = unwrappedParams;
  return {
    title: id
      ? `Interview Practice #${id} | Xcode`
      : "Interview Practice | Xcode",
  };
}

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
