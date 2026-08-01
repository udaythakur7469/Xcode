"use client";

import React from "react";
import Navbar from "@/components/landingPage/navbar/Navbar";
import UserProfile from "@/components/accountPage/UserProfile";
import { useUserStore } from "@/features/userStore";
import { UserProfileSkeleton } from "@/components/accountPage/UserProfileSkeleton";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import AccountAuthGate from "@/components/accountPage/AccountAuthGate";

type pageProps = {
  params: {
    name: string;
  };
};

const Page: React.FC<pageProps> = ({ params }) => {
  const unwrappedParams = React.use(params);
  const { name } = unwrappedParams;

  const { userData } = useUserStore();

  useDocumentTitle(name ? `${decodeURIComponent(name)} | Xcode` : null);

  if (!name) {
    return <div className="text-red-500 text-xl">User not found</div>;
  }

  return (
    <>
      <Navbar firstButton={"Solve Problems"} secondButton={"Mock Interviews"} />
      <AccountAuthGate>
        {userData ? <UserProfile /> : <UserProfileSkeleton />}
      </AccountAuthGate>
    </>
  );
};
export default Page;
