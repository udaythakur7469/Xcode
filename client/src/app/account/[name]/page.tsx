"use client";

import React from "react";
import Navbar from "@/components/landingPage/navbar/Navbar";
import UserProfile from "@/components/accountPage/UserProfile";

type pageProps = {
  params: {
    name: string;
  };
};

const Page: React.FC<pageProps> = ({ params }) => {
  const unwrappedParams = React.use(params);
  const { name } = unwrappedParams;

  if (!name) {
    return <div className="text-red-500 text-xl">User not found</div>;
  }

  return (
    <>
      <Navbar firstButton={"Solve Problems"} secondButton={"Mock Interviews"} />
      <UserProfile />
    </>
  );
};
export default Page;
