"use client";

import Navbar from "@/components/landingPage/navbar/Navbar";
import ContestsList from "@/components/contestsPage/contestsList/ContestsList";

export default function ContestsHomePage() {
  return (
    <>
      <Navbar buttons={["Explore Xcode", "Solve Problems", "Mock Interviews"]} />
      <ContestsList />
    </>
  );
}
