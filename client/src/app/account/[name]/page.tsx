"use client";

import React, { useEffect, useRef } from "react";
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

  const { userData, isUserAuthenticated, fetchProfileDetails } = useUserStore();

  // checkAuth() (run once by AuthProvider) only ever populates identity
  // fields now — stats/links come from fetchProfileDetails(), which is
  // only ever called here, since this is the one page that needs them.
  // hasRequestedProfileDetails guards against re-fetching on every
  // re-render once isUserAuthenticated flips true.
  const hasRequestedProfileDetails = useRef(false);

  useEffect(() => {
    if (!isUserAuthenticated || hasRequestedProfileDetails.current) return;
    hasRequestedProfileDetails.current = true;
    fetchProfileDetails();
  }, [isUserAuthenticated, fetchProfileDetails]);

  useDocumentTitle(name ? `${decodeURIComponent(name)} | Xcode` : null);

  if (!name) {
    return <div className="text-red-500 text-xl">User not found</div>;
  }

  const hasProfileDetails = Boolean(userData?.stats);

  return (
    <>
      <Navbar buttons={["Solve Problems", "Mock Interviews"]} />
      <AccountAuthGate>
        {hasProfileDetails ? <UserProfile /> : <UserProfileSkeleton />}
      </AccountAuthGate>
    </>
  );
};
export default Page;
