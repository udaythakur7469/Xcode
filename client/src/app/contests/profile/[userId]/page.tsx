"use client";

import Navbar from "@/components/landingPage/navbar/Navbar";
import ContestProfile from "@/components/contestsPage/profile/ContestProfile";

export default function ContestProfilePage() {
  return (
    <>
      <Navbar buttons={["Explore Xcode", "Solve Problems", "Mock Interviews"]} />
      <ContestProfile />
    </>
  );
}
