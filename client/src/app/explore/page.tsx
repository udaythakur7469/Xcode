import React, { Suspense } from "react";
import Features from "@/components/explorePage/Features";
import Title from "@/components/explorePage/Title";
import Navbar from "@/components/landingPage/navbar/Navbar";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Explore | Xcode",
};

type pageProps = {};

const page: React.FC<pageProps> = () => {
  return (
    <Suspense fallback={null}>
      <Navbar firstButton={"Solve Problems"} secondButton={"Mock Interviews"} />
      <Title />
      <Features />
    </Suspense>
  );
};
export default page;
