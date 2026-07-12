"use client";

import React from "react";
import Navbar from "@/components/landingPage/navbar/Navbar";
import UserProfile from "@/components/accountPage/UserProfile";
import { useUserStore } from "@/features/userStore";
import { UserProfileSkeleton } from "@/components/accountPage/UserProfileSkeleton";

type pageProps = {
  params: Promise<{
    name: string;
  }>;
};

const Page = ({ params }: pageProps) => {
  const unwrappedParams = React.use(params);
  const { name } = unwrappedParams;

  const { isCheckingUserAuth } = useUserStore();

  if (!name) {
    return <div className="text-red-500 text-xl">User not found</div>;
  }

  return (
    <>
      <Navbar firstButton={"Solve Problems"} secondButton={"Mock Interviews"} />
      {isCheckingUserAuth ? <UserProfileSkeleton /> : <UserProfile />}
    </>
  );
};
export default Page;
