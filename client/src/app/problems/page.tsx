"use client";

import Navbar from "@/components/landingPage/navbar/Navbar";
import AIdialog from "@/components/problemsPage/aiChat/AIdialog";
import ProblemCalender from "@/components/problemsPage/helperComponents/ProblemCalender";
import ProblemList from "@/components/problemsPage/problemsList/ProblemList";
import { Card } from "@/components/ui/card";
import React from "react";

type pageProps = {};

const page: React.FC<pageProps> = () => {
  return (
    <>
      <Navbar firstButton={"Explore Xcode"} secondButton={"Mock Interviews"} />
      <div className="h-screen w-full flex flex-row gap-5 px-[20px] mb-5 mt-3">
        <div className=" flex-1 flex flex-col items-center ">
          <ProblemList />
        </div>
        <div className="ml-auto flex flex-col gap-5 h-screen">
          <ProblemCalender />
          <Card className="rounded-md flex justify-center items-center h-40">
            <AIdialog />
          </Card>
        </div>
      </div>
    </>
  );
};

export default page;
