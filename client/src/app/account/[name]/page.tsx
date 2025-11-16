"use client";

import React, { useEffect } from "react";
import Navbar from "@/components/landingPage/navbar/Navbar";
import UserProfile from "@/components/accountPage/UserProfile";
import { useAuthStore } from "@/features/authStore";
import { useRouter } from "next/navigation";

type pageProps = {
  params: {
    name: string;
  };
};

const Page: React.FC<pageProps> = ({ params }) => {
  const router = useRouter();

  const { isAuthenticated } = useAuthStore();
  const unwrappedParams = React.use(params);
  const { name } = unwrappedParams;

  // 🔥 Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return null; // avoid flashing content
  }

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
